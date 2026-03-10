using System.Net;

namespace Backend.Infrastructure.Devices;

/// <summary>Проверка логина и пароля устройства через ISAPI.</summary>
/// <remarks>
/// Hikvision: ISAPI — HTTP/HTTPS на портах 80/443; SDK — TCP на порту 8000.
/// SADP возвращает CommandPort (8000). При port=8000 пробуем ISAPI на 80 и 443.
/// </remarks>
public static class DeviceCredentialVerifier
{
    /// <summary>Проверяет учётные данные. Возвращает (успех, сообщение об ошибке).</summary>
    public static async Task<(bool Valid, string? Message)> VerifyAsync(
        string ipAddress,
        int port,
        string username,
        string password,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(ipAddress) || port <= 0 || port > 65535)
        {
            return (false, "Некорректный IP или порт.");
        }

        if (string.IsNullOrWhiteSpace(password))
        {
            return (false, "Пароль обязателен.");
        }

        var cred = new NetworkCredential(
            string.IsNullOrWhiteSpace(username) ? "admin" : username.Trim(),
            password);

        var isapiPorts = IsapiPortHelper.GetPortsToTry(port);

        string? lastError = null;
        foreach (var isapiPort in isapiPorts)
        {
            var result = await TryVerifyOnPortAsync(ipAddress, isapiPort, cred, cancellationToken);
            if (result.Success)
                return (true, null);
            lastError = result.Message;
            // 401/403 — учётные данные неверны, не пробуем другие порты
            if (result.IsAuthError)
                return (false, lastError);
        }

        return (false, lastError ?? "Не удалось подключиться к устройству.");
    }

    private static async Task<(bool Success, string? Message, bool IsAuthError)> TryVerifyOnPortAsync(
        string ipAddress,
        int port,
        NetworkCredential cred,
        CancellationToken cancellationToken)
    {
        var scheme = port == 443 ? "https" : "http";
        var uri = new Uri($"{scheme}://{ipAddress}:{port}/ISAPI/System/deviceInfo");

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
            Timeout = TimeSpan.FromSeconds(6)
        };

        try
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeSpan.FromSeconds(5));

            using var request = new HttpRequestMessage(HttpMethod.Get, uri);
            using var response = await client.SendAsync(request, cts.Token);

            if (response.StatusCode == HttpStatusCode.Unauthorized)
                return (false, "Неверный логин или пароль.", true);

            if (response.StatusCode == HttpStatusCode.Forbidden)
                return (false, "Доступ запрещён.", true);

            if (response.StatusCode == HttpStatusCode.NotFound)
                return (false, "Устройство не поддерживает ISAPI.", false);

            if (!response.IsSuccessStatusCode)
                return (false, $"Ошибка устройства: {(int)response.StatusCode}.", false);

            return (true, null, false);
        }
        catch (OperationCanceledException)
        {
            return (false, "Таймаут. Проверьте сеть и доступность устройства.", false);
        }
        catch (HttpRequestException ex)
        {
            return (false, ex.InnerException?.Message ?? "Ошибка сети.", false);
        }
        catch (Exception ex)
        {
            return (false, ex.Message, false);
        }
    }
}
