using System.Net;
using System.Net.Http.Headers;
using System.Text;

namespace Backend.Infrastructure.Devices;

/// <summary>HTTP-клиент для ISAPI Hikvision с Digest Auth. Поддерживает GET, POST, PUT, multipart/form-data.</summary>
public sealed class IsapiClient
{
    private readonly string _ipAddress;
    private readonly int[] _ports;
    private readonly NetworkCredential _credential;
    private readonly TimeSpan _timeout;

    public IsapiClient(string ipAddress, int devicePort, string username, string password, TimeSpan? timeout = null)
    {
        if (string.IsNullOrWhiteSpace(ipAddress))
            throw new ArgumentException("IP address is required.", nameof(ipAddress));
        if (string.IsNullOrWhiteSpace(password))
            throw new ArgumentException("Password is required.", nameof(password));

        _ipAddress = ipAddress.Trim();
        _ports = IsapiPortHelper.GetPortsToTry(devicePort);
        _credential = new NetworkCredential(
            string.IsNullOrWhiteSpace(username) ? "admin" : username.Trim(),
            password);
        _timeout = timeout ?? TimeSpan.FromSeconds(12);
    }

    /// <summary>Выполняет GET-запрос. Пробует порты по очереди. Возвращает (успех, тело ответа, сообщение об ошибке).</summary>
    public async Task<(bool Success, string? Content, string? Error)> GetAsync(
        string path,
        CancellationToken cancellationToken = default)
    {
        string? lastError = null;
        foreach (var port in _ports)
        {
            var (success, content, error, isAuthError) = await TryRequestAsync(
                port,
                path,
                HttpMethod.Get,
                null,
                cancellationToken);
            if (success)
                return (true, content, null);
            if (isAuthError)
                return (false, null, error);
            lastError = error;
        }
        return (false, null, lastError ?? "Устройство недоступно или не поддерживает запрос.");
    }

    /// <summary>Выполняет POST с JSON. path должен включать ?format=json при необходимости.</summary>
    public async Task<(bool Success, string? Content, string? Error)> PostJsonAsync(
        string path,
        string jsonBody,
        CancellationToken cancellationToken = default)
    {
        return await PostAsync(path, jsonBody, "application/json", cancellationToken);
    }

    /// <summary>Выполняет POST с произвольным телом и Content-Type.</summary>
    public async Task<(bool Success, string? Content, string? Error)> PostAsync(
        string path,
        string body,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        string? lastError = null;
        foreach (var port in _ports)
        {
            var (success, content, error, isAuthError) = await TryRequestAsync(
                port,
                path,
                HttpMethod.Post,
                new StringContent(body, Encoding.UTF8, contentType),
                cancellationToken);
            if (success)
                return (true, content, null);
            if (isAuthError)
                return (false, null, error);
            lastError = error;
        }
        return (false, null, lastError ?? "Устройство недоступно или не поддерживает запрос.");
    }

    /// <summary>Выполняет PUT с JSON.</summary>
    public async Task<(bool Success, string? Content, string? Error)> PutJsonAsync(
        string path,
        string jsonBody,
        CancellationToken cancellationToken = default)
    {
        return await PutAsync(path, jsonBody, "application/json", cancellationToken);
    }

    /// <summary>Выполняет DELETE с опциональным телом (некоторые устройства ожидают DELETE вместо PUT).</summary>
    public async Task<(bool Success, string? Content, string? Error)> DeleteAsync(
        string path,
        string? body = null,
        string? contentType = null,
        CancellationToken cancellationToken = default)
    {
        HttpContent? content = null;
        if (body != null && contentType != null)
            content = new StringContent(body, Encoding.UTF8, contentType);
        string? lastError = null;
        foreach (var port in _ports)
        {
            var (success, c, error, isAuthError) = await TryRequestAsync(port, path, HttpMethod.Delete, content, cancellationToken);
            if (success) return (true, c, null);
            if (isAuthError) return (false, null, error);
            lastError = error;
        }
        return (false, null, lastError ?? "Устройство недоступно или не поддерживает запрос.");
    }

    /// <summary>Выполняет PUT с произвольным телом и Content-Type.</summary>
    public async Task<(bool Success, string? Content, string? Error)> PutAsync(
        string path,
        string body,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        string? lastError = null;
        foreach (var port in _ports)
        {
            var (success, content, error, isAuthError) = await TryRequestAsync(
                port,
                path,
                HttpMethod.Put,
                new StringContent(body, Encoding.UTF8, contentType),
                cancellationToken);
            if (success)
                return (true, content, null);
            if (isAuthError)
                return (false, null, error);
            lastError = error;
        }
        return (false, null, lastError ?? "Устройство недоступно или не поддерживает запрос.");
    }

    /// <summary>Выполняет POST multipart/form-data. parts: имя части -> (content, content-type, optional filename).</summary>
    public async Task<(bool Success, string? Content, string? Error)> PostMultipartAsync(
        string path,
        IReadOnlyDictionary<string, (HttpContent Content, string? FileName)> parts,
        CancellationToken cancellationToken = default)
    {
        string? lastError = null;
        foreach (var port in _ports)
        {
            var (success, content, error, isAuthError) = await TryMultipartAsync(port, path, parts, cancellationToken);
            if (success)
                return (true, content, null);
            if (isAuthError)
                return (false, null, error);
            lastError = error;
        }
        return (false, null, lastError ?? "Устройство недоступно или не поддерживает запрос.");
    }

    private async Task<(bool Success, string? Content, string? Error, bool IsAuthError)> TryRequestAsync(
        int port,
        string path,
        HttpMethod method,
        HttpContent? content,
        CancellationToken cancellationToken)
    {
        var scheme = port == 443 ? "https" : "http";
        var pathTrimmed = path.TrimStart('/');
        var uri = new Uri($"{scheme}://{_ipAddress}:{port}/{pathTrimmed}");

        using var handler = new HttpClientHandler
        {
            Credentials = _credential,
            PreAuthenticate = false,
            AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate
        };
        if (scheme == "https")
            handler.ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator;

        using var client = new HttpClient(handler, disposeHandler: true) { Timeout = _timeout };

        try
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(_timeout);

            using var request = new HttpRequestMessage(method, uri);
            request.Headers.ConnectionClose = true;
            request.Headers.Accept.ParseAdd("application/json");
            request.Headers.Accept.ParseAdd("application/xml");
            if (content != null)
                request.Content = content;

            using var response = await client.SendAsync(request, cts.Token);

            if (response.StatusCode == HttpStatusCode.Unauthorized)
                return (false, null, "Неверный логин или пароль.", true);
            if (response.StatusCode == HttpStatusCode.Forbidden)
                return (false, null, "Доступ запрещён.", true);
            if (response.StatusCode == HttpStatusCode.NotFound)
                return (false, null, "Endpoint не найден (404).", false);
            if (!response.IsSuccessStatusCode)
            {
                var errBody = await response.Content.ReadAsStringAsync(cts.Token);
                var errTrimmed = errBody?.Trim() ?? "";
                var errMsg = string.IsNullOrWhiteSpace(errTrimmed)
                    ? $"HTTP {(int)response.StatusCode}."
                    : $"HTTP {(int)response.StatusCode}: {(errTrimmed.Length > 200 ? errTrimmed[..200] + "..." : errTrimmed)}";
                return (false, null, errMsg, false);
            }

            var body = await response.Content.ReadAsStringAsync(cts.Token);
            return (true, body, null, false);
        }
        catch (OperationCanceledException)
        {
            return (false, null, "Таймаут.", false);
        }
        catch (HttpRequestException ex)
        {
            return (false, null, ex.InnerException?.Message ?? "Ошибка сети.", false);
        }
        catch (Exception ex)
        {
            return (false, null, ex.Message, false);
        }
    }

    private async Task<(bool Success, string? Content, string? Error, bool IsAuthError)> TryMultipartAsync(
        int port,
        string path,
        IReadOnlyDictionary<string, (HttpContent Content, string? FileName)> parts,
        CancellationToken cancellationToken)
    {
        var scheme = port == 443 ? "https" : "http";
        var pathTrimmed = path.TrimStart('/');
        var uri = new Uri($"{scheme}://{_ipAddress}:{port}/{pathTrimmed}");

        using var handler = new HttpClientHandler
        {
            Credentials = _credential,
            PreAuthenticate = false,
            AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate
        };
        if (scheme == "https")
            handler.ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator;

        using var client = new HttpClient(handler, disposeHandler: true) { Timeout = TimeSpan.FromSeconds(30) };

        using var content = new MultipartFormDataContent();
        foreach (var (name, (partContent, fileName)) in parts)
        {
            if (!string.IsNullOrEmpty(fileName))
                content.Add(partContent, name, fileName);
            else
                content.Add(partContent, name);
        }

        try
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeSpan.FromSeconds(25));

            using var request = new HttpRequestMessage(HttpMethod.Post, uri);
            request.Headers.ConnectionClose = true;
            request.Content = content;

            using var response = await client.SendAsync(request, cts.Token);

            if (response.StatusCode == HttpStatusCode.Unauthorized)
                return (false, null, "Неверный логин или пароль.", true);
            if (response.StatusCode == HttpStatusCode.Forbidden)
                return (false, null, "Доступ запрещён.", true);
            if (response.StatusCode == HttpStatusCode.NotFound)
                return (false, null, "Endpoint не найден (404).", false);
            if (!response.IsSuccessStatusCode)
                return (false, null, $"HTTP {(int)response.StatusCode}.", false);

            var body = await response.Content.ReadAsStringAsync(cts.Token);
            return (true, body, null, false);
        }
        catch (OperationCanceledException)
        {
            return (false, null, "Таймаут.", false);
        }
        catch (HttpRequestException ex)
        {
            return (false, null, ex.InnerException?.Message ?? "Ошибка сети.", false);
        }
        catch (Exception ex)
        {
            return (false, null, ex.Message, false);
        }
    }
}
