using System.Security.Cryptography;
using System.Text;

namespace Backend.Infrastructure.Devices.Sdk;

/// <summary>
/// Шифрование пароля для SADP activate (EncryptPWByRandomStr).
/// RSA 1024 — расшифровка EncryptString → RandomStr.
/// AES ECB — шифрование пароля ключом RandomStr.
/// </summary>
public static class SadpActivationCrypto
{
    /// <summary>
    /// Расшифровывает EncryptString приватным RSA-ключом и шифрует пароль.
    /// </summary>
    /// <param name="encryptStringBase64">Base64 EncryptString от устройства (getencryptstring).</param>
    /// <param name="password">Пароль в открытом виде.</param>
    /// <param name="rsaPrivateKeyPem">PEM приватного ключа RSA 1024 (из Sadp.dll).</param>
    /// <returns>Base64 зашифрованного пароля для &lt;Password&gt; в activate.</returns>
    public static string? EncryptPassword(string encryptStringBase64, string password, string rsaPrivateKeyPem)
    {
        if (string.IsNullOrWhiteSpace(encryptStringBase64) || string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(rsaPrivateKeyPem))
            return null;

        try
        {
            var encryptedBytes = Convert.FromBase64String(encryptStringBase64.Trim());
            if (encryptedBytes.Length == 0) return null;

            using var rsa = RSA.Create();
            rsa.ImportFromPem(rsaPrivateKeyPem);

            var randomStrBytes = rsa.Decrypt(encryptedBytes, RSAEncryptionPadding.Pkcs1);
            if (randomStrBytes is null or { Length: 0 }) return null;

            var randomStr = Encoding.UTF8.GetString(randomStrBytes);
            var keyBytes = DeriveAesKey(randomStr);

            var passwordBytes = Encoding.UTF8.GetBytes(password);
            var encrypted = AesEcbEncrypt(passwordBytes, keyBytes);
            return Convert.ToBase64String(encrypted);
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// Длина RandomStr в Hikvision — 16 байт, используется как AES-128 ключ.
    /// </summary>
    private static byte[] DeriveAesKey(string randomStr)
    {
        var bytes = Encoding.UTF8.GetBytes(randomStr);
        if (bytes.Length >= 16) return bytes[..16];
        var key = new byte[16];
        Array.Copy(bytes, key, bytes.Length);
        return key;
    }

    private static byte[] AesEcbEncrypt(byte[] data, byte[] key)
    {
        using var aes = Aes.Create();
        aes.Key = key;
        aes.Mode = CipherMode.ECB;
        aes.Padding = PaddingMode.PKCS7;
        using var enc = aes.CreateEncryptor();
        return enc.TransformFinalBlock(data, 0, data.Length);
    }
}
