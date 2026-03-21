using System.Text.Json;
using System.Text.Json.Serialization;

namespace Backend.Infrastructure.Devices;

/// <summary>
/// POST /ISAPI/AccessControl/FingerPrintDownload?format=json — тело запроса (Value Series / Pro).
/// Устройство требует узел <c>enableCardReader</c> и корень <c>FingerPrintCfg</c>.
/// </summary>
public static class IsapiFingerPrintDownload
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = null,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public static string BuildJson(string employeeNo, int fingerPrintId, string fingerDataBase64) =>
        JsonSerializer.Serialize(
            new FingerPrintDownloadRoot
            {
                FingerPrintCfg = new FingerPrintCfgBody
                {
                    EmployeeNo = employeeNo,
                    FingerPrintId = fingerPrintId,
                    FingerType = "normalFP",
                    FingerData = fingerDataBase64,
                    EnableCardReader = [1],
                },
            },
            SerializerOptions);

    private sealed class FingerPrintDownloadRoot
    {
        [JsonPropertyName("FingerPrintCfg")]
        public FingerPrintCfgBody? FingerPrintCfg { get; set; }
    }

    private sealed class FingerPrintCfgBody
    {
        [JsonPropertyName("employeeNo")]
        public string EmployeeNo { get; set; } = "";

        [JsonPropertyName("fingerPrintID")]
        public int FingerPrintId { get; set; }

        [JsonPropertyName("fingerType")]
        public string FingerType { get; set; } = "normalFP";

        [JsonPropertyName("fingerData")]
        public string FingerData { get; set; } = "";

        /// <summary>Номера считывателей карт/отпечатков (обязательный узел на прошивке).</summary>
        [JsonPropertyName("enableCardReader")]
        public int[] EnableCardReader { get; set; } = [1];
    }
}
