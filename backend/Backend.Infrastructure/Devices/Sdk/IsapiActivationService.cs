using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Xml.Linq;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Devices.Sdk;

/// <summary>
/// Активация Hikvision-устройств через ISAPI (HTTP).
/// POST /ISAPI/Security/challenge → PUT /ISAPI/System/activate.
/// Работает по TCP, не требует подсети (в отличие от SADP).
/// </summary>
public static class IsapiActivationService
{
    private static readonly string[] ChallengeNamespaces = ["", "http://www.hikvision.com/ver20/XMLSchema", "http://www.isapi.org/ver20/XMLSchema"];
    private static readonly string[] ActivateNamespaces = ["", "http://www.hikvision.com/ver20/XMLSchema", "http://www.isapi.org/ver20/XMLSchema"];

    /// <summary>
    /// Пытается активировать устройство через ISAPI.
    /// </summary>
    /// <returns>(Success, Message) — при успехе Message=null.</returns>
    public static async Task<(bool Success, string? Message)> TryActivateAsync(
        string ipAddress,
        int port,
        string password,
        ILogger logger,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(ipAddress) || string.IsNullOrWhiteSpace(password))
        {
            return (false, "IP и пароль обязательны.");
        }

        var portNum = port > 0 ? port : 80;
        var portsToTry = portNum == 8000 ? new[] { 80, 8000 } : new[] { portNum };

        using var handler = new HttpClientHandler
        {
            ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
        };
        using var client = new HttpClient(handler, disposeHandler: true)
        {
            Timeout = TimeSpan.FromSeconds(15)
        };

        try
        {
            using var rsa = RSA.Create(1024);
            var publicKeyXml = BuildChallengeRequest(rsa);

            foreach (var p in portsToTry)
            {
                var baseUrl = $"http://{ipAddress}:{p}";
                var challengeUrl = $"{baseUrl}/ISAPI/Security/challenge";

                logger.LogInformation("ISAPI activate: POST {Url}", challengeUrl);

                using var challengeRequest = new HttpRequestMessage(HttpMethod.Post, challengeUrl);
                challengeRequest.Content = new StringContent(publicKeyXml, Encoding.UTF8, "application/xml");

                using var challengeResponse = await client.SendAsync(challengeRequest, cancellationToken);
                var challengeBody = await challengeResponse.Content.ReadAsStringAsync(cancellationToken);
                var challengePreview = challengeBody.Length > 400 ? challengeBody[..400] + "..." : challengeBody;
                logger.LogInformation("ISAPI challenge port {Port}: {Status} | response: {Body}", p, challengeResponse.StatusCode, challengePreview);

                if (!challengeResponse.IsSuccessStatusCode)
                {
                    continue;
                }

                var encryptedKey = ExtractChallengeKey(challengeBody);
                if (string.IsNullOrWhiteSpace(encryptedKey))
                {
                    logger.LogInformation("ISAPI challenge port {Port}: no key in response", p);
                    continue;
                }

                var randomKey = DecryptRandomKey(encryptedKey, rsa);
                if (randomKey is null or { Length: 0 })
                {
                    logger.LogWarning("ISAPI: failed to decrypt challenge key");
                    return (false, "Ошибка расшифровки ключа.");
                }

                var encryptedPassword = EncryptPasswordIsapi(randomKey, password);
                if (string.IsNullOrWhiteSpace(encryptedPassword))
                {
                    return (false, "Ошибка шифрования пароля.");
                }

                var activateUrl = $"{baseUrl}/ISAPI/System/activate";
                // Face Recognition Terminals: формат Activate + ActivateInfo (namespace isapi.org/ver20)
                var activateXml = $"<?xml version=\"1.0\" encoding=\"UTF-8\"?><Activate version=\"2.0\" xmlns=\"http://www.isapi.org/ver20/XMLSchema\"><ActivateInfo><password>{encryptedPassword}</password></ActivateInfo></Activate>";

                logger.LogInformation("ISAPI activate: PUT {Url}", activateUrl);

                using var activateRequest = new HttpRequestMessage(HttpMethod.Put, activateUrl);
                activateRequest.Content = new StringContent(activateXml, Encoding.UTF8, "application/xml");

                using var activateResponse = await client.SendAsync(activateRequest, cancellationToken);
                var activateBody = await activateResponse.Content.ReadAsStringAsync(cancellationToken);
                var activatePreview = activateBody.Length > 500 ? activateBody[..500] + "..." : activateBody;
                logger.LogInformation("ISAPI activate port {Port}: {Status} | response: {Body}", p, activateResponse.StatusCode, activatePreview);

                if (activateResponse.IsSuccessStatusCode)
                {
                    if (activateBody.Contains("OK", StringComparison.OrdinalIgnoreCase) ||
                        (activateBody.Contains("statusString", StringComparison.OrdinalIgnoreCase) && activateBody.Contains("OK", StringComparison.OrdinalIgnoreCase)))
                    {
                        logger.LogInformation("ISAPI activate: success for {Ip}:{Port}", ipAddress, p);
                        return (true, null);
                    }
                }

                if (!activateBody.Contains("MessageParametersLack", StringComparison.OrdinalIgnoreCase))
                {
                    logger.LogWarning("ISAPI activate port {Port} failed: {Status} {Body}", p, activateResponse.StatusCode, activatePreview);
                }
            }

            return (false, "ISAPI activate: устройство недоступно или уже активировано.");
        }
        catch (HttpRequestException ex)
        {
            logger.LogWarning(ex, "ISAPI activate: HTTP error for {Ip}:{Port}", ipAddress, portNum);
            return (false, "Устройство недоступно по HTTP. Проверьте IP, порт и сеть.");
        }
        catch (TaskCanceledException)
        {
            return (false, "Таймаут запроса.");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "ISAPI activate failed for {Ip}:{Port}", ipAddress, portNum);
            return (false, ex.Message);
        }
    }

    /// <summary>
    /// По ISAPI Face Recognition Terminals: 128-byte modulus, leading 0 удалить.
    /// bytesToHexstring -> 256 hex chars -> Base64.
    /// </summary>
    private static string BuildChallengeRequest(RSA rsa)
    {
        var parameters = rsa.ExportParameters(false);
        var n = parameters.Modulus ?? [];
        // Документация: "128-byte modulus. If the length is longer than 128, the leading 0 needs to be removed"
        var modulus = n;
        while (modulus.Length > 128 && modulus[0] == 0)
            modulus = modulus[1..];
        var nHex = Convert.ToHexString(modulus).ToLowerInvariant();
        var nHexBytes = Encoding.ASCII.GetBytes(nHex);
        var nBase64 = Convert.ToBase64String(nHexBytes);

        return $"<?xml version=\"1.0\" encoding=\"UTF-8\"?><Challenge version=\"2.0\" xmlns=\"http://www.isapi.org/ver20/XMLSchema\"><key>{nBase64}</key></Challenge>";
    }

    private static string? ExtractChallengeKey(string xml)
    {
        try
        {
            var doc = XDocument.Parse(xml);
            var root = doc.Root;
            if (root is null) return null;

            foreach (var ns in ChallengeNamespaces)
            {
                var keyEl = root.Descendants().FirstOrDefault(x =>
                    string.Equals(x.Name.LocalName, "key", StringComparison.OrdinalIgnoreCase));
                if (keyEl?.Value is { } v && !string.IsNullOrWhiteSpace(v))
                    return v.Trim();
            }

            var key = root.Descendants().FirstOrDefault(x => string.Equals(x.Name.LocalName, "key", StringComparison.OrdinalIgnoreCase));
            return key?.Value?.Trim();
        }
        catch
        {
            return null;
        }
    }

    private static byte[]? DecryptRandomKey(string encryptedKeyBase64, RSA rsa)
    {
        try
        {
            var decoded = Convert.FromBase64String(encryptedKeyBase64.Trim());
            var hexStr = Encoding.ASCII.GetString(decoded);
            var encryptedBytes = Convert.FromHexString(hexStr.ToUpperInvariant());

            var decrypted = rsa.Decrypt(encryptedBytes, RSAEncryptionPadding.Pkcs1);
            return decrypted.Length >= 32 ? decrypted[^32..] : decrypted;
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// Шифрование пароля по алгоритму Hikvision ISAPI (совместимо с cam_config / qb60).
    /// randomKey = последние 32 байта RSA-расшифровки (hex-строка в ASCII).
    /// AES-ключ = hex-decode(randomKey) = 16 байт. Блоки: first 16 bytes of hex, password padded.
    /// </summary>
    private static string? EncryptPasswordIsapi(byte[] randomKey, string password)
    {
        try
        {
            // randomKey = 32 байта ASCII hex (как в Python: decrypt[-32:])
            // AES key = hex-decode этих 32 байт = 16 байт
            var hexStr = Encoding.ASCII.GetString(randomKey);
            var aesKey = Convert.FromHexString(hexStr.ToUpperInvariant());

            // first_part = первые 16 байт hex-строки (как в Python: random_key_text[:16])
            var firstPart = new byte[16];
            var firstLen = Math.Min(16, randomKey.Length);
            Array.Copy(randomKey, firstPart, firstLen);

            var passwordBytes = Encoding.ASCII.GetBytes(password);
            var padded = new byte[16];
            var copyLen = Math.Min(passwordBytes.Length, 16);
            Array.Copy(passwordBytes, padded, copyLen);

            using var aes = Aes.Create();
            aes.Key = aesKey;
            aes.Mode = CipherMode.ECB;
            aes.Padding = PaddingMode.None;

            using var enc = aes.CreateEncryptor();
            var block1 = enc.TransformFinalBlock(firstPart, 0, 16);
            var block2 = enc.TransformFinalBlock(padded, 0, 16);
            var combined = new byte[block1.Length + block2.Length];
            Array.Copy(block1, combined, block1.Length);
            Array.Copy(block2, 0, combined, block1.Length, block2.Length);

            var hexEncoded = Convert.ToHexString(combined).ToLowerInvariant();
            return Convert.ToBase64String(Encoding.ASCII.GetBytes(hexEncoded));
        }
        catch
        {
            return null;
        }
    }

    private static string? ParseActivateError(string xml)
    {
        try
        {
            var doc = XDocument.Parse(xml);
            var status = doc.Descendants().FirstOrDefault(x => string.Equals(x.Name.LocalName, "statusString", StringComparison.OrdinalIgnoreCase))?.Value;
            var subStatus = doc.Descendants().FirstOrDefault(x => string.Equals(x.Name.LocalName, "subStatusCode", StringComparison.OrdinalIgnoreCase))?.Value;
            if (!string.IsNullOrWhiteSpace(status))
                return subStatus is { } s ? $"{status} ({s})" : status;
        }
        catch { }
        return null;
    }
}
