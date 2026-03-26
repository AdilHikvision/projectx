using System.Net;
using System.Text;
using Backend.Application.Devices;
using Backend.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Devices.Services;

/// <summary>Управление дверями Hikvision через ISAPI (RemoteOpenDoor, RemoteCloseDoor и т.д.).</summary>
public sealed class DeviceDoorControlService(
    AppDbContext dbContext,
    IConfiguration configuration,
    ILogger<DeviceDoorControlService> logger) : IDeviceDoorControlService
{
    public async Task<(bool Success, string? Message)> ControlDoorAsync(
        Guid deviceId,
        int doorIndex,
        DoorControlAction action,
        int? callNumber = null,
        string? callElevatorType = null,
        CancellationToken cancellationToken = default)
    {
        var device = await dbContext.Devices.AsNoTracking().FirstOrDefaultAsync(x => x.Id == deviceId, cancellationToken);
        if (device is null)
            return (false, "Устройство не найдено.");

        if (doorIndex < 0)
            return (false, "Некорректный индекс двери.");

        var username = configuration["Hikvision:Username"] ?? "admin";
        var password = (configuration["Hikvision:Password"] ?? "12345").Trim();
        if (string.IsNullOrEmpty(password)) password = "12345";

        var cred = new NetworkCredential(
            string.IsNullOrWhiteSpace(device.Username) ? username : device.Username,
            string.IsNullOrWhiteSpace(device.Password) ? password : device.Password);

        var ports = IsapiPortHelper.GetPortsToTry(device.Port);
        foreach (var port in ports)
        {
            var (success, message) = await TryControlOnPortAsync(device.IpAddress, port, doorIndex, action, callNumber, callElevatorType, cred, cancellationToken);
            if (success)
            {
                logger.LogInformation("Door control {Action} for device {Device} door {Door} on port {Port} succeeded", action, device.Name, doorIndex, port);
                return (true, null);
            }
            if (message?.Contains("401") == true || message?.Contains("403") == true || message?.Contains("Неверный") == true)
                return (false, message);
        }

        return (false, "Не удалось выполнить команду. Проверьте устройство и сеть.");
    }

    private static async Task<(bool Success, string? Message)> TryControlOnPortAsync(
        string ipAddress,
        int port,
        int doorIndex,
        DoorControlAction action,
        int? callNumber,
        string? callElevatorType,
        NetworkCredential cred,
        CancellationToken cancellationToken)
    {
        var doorId = doorIndex + 1;
        var scheme = port == 443 ? "https" : "http";

        using var handler = new HttpClientHandler
        {
            Credentials = cred,
            PreAuthenticate = false,
            AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate
        };
        if (scheme == "https")
        {
            handler.ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator;
        }

        using var client = new HttpClient(handler, disposeHandler: true)
        {
            Timeout = TimeSpan.FromSeconds(10)
        };

        var proUri = new Uri($"{scheme}://{ipAddress}:{port}/ISAPI/AccessControl/RemoteControl/door/{doorId}");

        // Лифт (Pro Series): visitorCallLadder / householdCallLadder — только PUT RemoteControl/door.
        if (action is DoorControlAction.VisitorCallLadder or DoorControlAction.HouseholdCallLadder)
        {
            var elevatorXml = BuildElevatorXml(action, doorId, callNumber, callElevatorType);
            return await SendControlRequestAsync(client, proUri, HttpMethod.Put, elevatorXml, cancellationToken);
        }

        // Pro Series: PUT /ISAPI/AccessControl/RemoteControl/door/<doorID> с <cmd>open|close|alwaysOpen|alwaysClose</cmd>
        var proCmd = action switch
        {
            DoorControlAction.Open => "open",
            DoorControlAction.Close => "close",
            DoorControlAction.AlwaysOpen => "alwaysOpen",
            DoorControlAction.AlwaysClose => "alwaysClose",
            _ => "open"
        };
        var proXml = $@"<?xml version=""1.0"" encoding=""UTF-8""?>
<RemoteControlDoor version=""2.0"" xmlns=""http://www.isapi.org/ver20/XMLSchema"">
  <cmd>{proCmd}</cmd>
</RemoteControlDoor>";
        var (proOk, proMsg) = await SendControlRequestAsync(client, proUri, HttpMethod.Put, proXml, cancellationToken);
        if (proOk) return (true, null);
        if (proMsg?.Contains("404") != true)
            return (false, proMsg);

        // Value Series: POST Control/RemoteOpenDoor или UserInfo/RemoteOpenDoor с <gateNo>
        var (valPath, valXmlName) = action switch
        {
            DoorControlAction.Open => ("RemoteOpenDoor", "RemoteOpenDoor"),
            DoorControlAction.Close => ("RemoteCloseDoor", "RemoteCloseDoor"),
            DoorControlAction.AlwaysOpen => ("RemoteAlwaysOpen", "RemoteAlwaysOpen"),
            DoorControlAction.AlwaysClose => ("RemoteAlwaysClose", "RemoteAlwaysClose"),
            _ => ("RemoteOpenDoor", "RemoteOpenDoor")
        };
        var valXml = $@"<?xml version=""1.0"" encoding=""UTF-8""?>
<{valXmlName} version=""2.0"" xmlns=""http://www.isapi.org/ver20/XMLSchema"">
  <gateNo>{doorId}</gateNo>
</{valXmlName}>";
        var valPaths = new[] { $"ISAPI/AccessControl/Control/{valPath}", $"ISAPI/AccessControl/UserInfo/{valPath}" };
        foreach (var basePath in valPaths)
        {
            var uri = new Uri($"{scheme}://{ipAddress}:{port}/{basePath}");
            var (ok, msg) = await SendControlRequestAsync(client, uri, HttpMethod.Post, valXml, cancellationToken);
            if (ok) return (true, null);
            if (msg?.Contains("404") != true)
                return (false, msg);
        }

        return (false, "Устройство не поддерживает управление дверями.");
    }

    private static string BuildElevatorXml(DoorControlAction action, int doorId, int? callNumber, string? callElevatorType)
    {
        if (action == DoorControlAction.VisitorCallLadder)
        {
            return """
<?xml version="1.0" encoding="UTF-8"?>
<RemoteControlDoor version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema">
  <cmd>visitorCallLadder</cmd>
</RemoteControlDoor>
""";
        }

        var num = callNumber ?? doorId;
        var dir = string.IsNullOrWhiteSpace(callElevatorType) ? "up" : callElevatorType.Trim().ToLowerInvariant();
        if (dir != "up" && dir != "down")
            dir = "up";

        return $"""
<?xml version="1.0" encoding="UTF-8"?>
<RemoteControlDoor version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema">
  <cmd>householdCallLadder</cmd>
  <callNumberList>
    <callNumber>{num}</callNumber>
  </callNumberList>
  <callElevatorType>{dir}</callElevatorType>
</RemoteControlDoor>
""";
    }

    private static async Task<(bool Success, string? Message)> SendControlRequestAsync(
        HttpClient client,
        Uri uri,
        HttpMethod method,
        string xml,
        CancellationToken cancellationToken)
    {
        try
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeSpan.FromSeconds(8));

            using var request = new HttpRequestMessage(method, uri)
            {
                Content = new StringContent(xml, Encoding.UTF8, "application/xml")
            };
            using var response = await client.SendAsync(request, cts.Token);

            if (response.StatusCode == HttpStatusCode.Unauthorized)
                return (false, "Неверный логин или пароль.");
            if (response.StatusCode == HttpStatusCode.Forbidden)
                return (false, "Доступ запрещён.");

            if (response.IsSuccessStatusCode)
                return (true, null);

            var body = await response.Content.ReadAsStringAsync(cts.Token);
            return (false, $"Ошибка устройства: {(int)response.StatusCode}. {body}");
        }
        catch (OperationCanceledException)
        {
            return (false, "Таймаут. Проверьте сеть и доступность устройства.");
        }
        catch (HttpRequestException ex)
        {
            return (false, ex.InnerException?.Message ?? "Ошибка сети.");
        }
        catch (Exception ex)
        {
            return (false, ex.Message);
        }
    }
}
