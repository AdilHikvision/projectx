using System.Collections.Generic;
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

    public static string BuildJson(string employeeNo, int fingerPrintId, string fingerDataBase64, int primaryCardReaderId = 1) =>
        JsonSerializer.Serialize(
            new FingerPrintDownloadRoot
            {
                FingerPrintCfg = new FingerPrintCfgBody
                {
                    EmployeeNo = employeeNo,
                    FingerPrintId = fingerPrintId,
                    FingerType = "normalFP",
                    FingerData = fingerDataBase64,
                    EnableCardReader = [primaryCardReaderId],
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

    /// <summary>
    /// Тело для PUT /ISAPI/AccessControl/FingerPrint/Delete?format=json
    /// по официальной спецификации Hikvision ISAPI.
    /// mode=byEmployeeNo — удаление по номеру сотрудника.
    /// </summary>
    public static string BuildDeleteBody(string employeeNo, int[]? fingerPrintIds = null, int[]? enableCardReader = null, string? deleteFingerPrintType = null)
    {
        var employeeNoDetail = new Dictionary<string, object?>
        {
            ["employeeNo"] = employeeNo,
        };

        if (enableCardReader is { Length: > 0 })
            employeeNoDetail["enableCardReader"] = enableCardReader;

        if (fingerPrintIds is { Length: > 0 })
            employeeNoDetail["fingerPrintID"] = fingerPrintIds;

        if (!string.IsNullOrWhiteSpace(deleteFingerPrintType))
            employeeNoDetail["deleteFingerPrintType"] = deleteFingerPrintType;

        return JsonSerializer.Serialize(
            new Dictionary<string, object?>
            {
                ["FingerPrintDelete"] = new Dictionary<string, object?>
                {
                    ["mode"] = "byEmployeeNo",
                    ["EmployeeNoDetail"] = employeeNoDetail,
                },
            },
            SerializerOptions);
    }

    /// <summary>
    /// Загрузка готового шаблона на терминал. По доке Hikvision Pro/Value:
    /// POST <c>FingerPrint/SetUp</c> применяет отпечаток (новый или замена);
    /// <c>FingerPrintDownload</c> только «добавление» — при уже существующем пальце или других учётных данных часто ошибка.
    /// </summary>
    public static async Task<(bool Success, string? Error)> TryUploadTemplateAsync(
        IsapiClient client,
        string jsonBody,
        CancellationToken cancellationToken = default)
    {
        string? lastError = null;
        foreach (var path in UploadEndpointOrder)
        {
            var (success, content, error) = await client.PostJsonAsync(path, jsonBody, cancellationToken);
            if (!success)
            {
                lastError = error;
                continue;
            }
            if (IsapiJsonStatus.GetErrorMessageIfFailed(content) is { } failMsg)
            {
                lastError = failMsg;
                continue;
            }
            return (true, null);
        }

        return (false, lastError);
    }

    /// <summary>Порядок: SetUp (универсальный), затем Download и альтернативный путь.</summary>
    private static readonly string[] UploadEndpointOrder =
    [
        "ISAPI/AccessControl/FingerPrint/SetUp?format=json",
        "ISAPI/AccessControl/FingerPrintDownload?format=json",
        "ISAPI/AccessControl/FingerPrintCfg/Download?format=json",
    ];

}
