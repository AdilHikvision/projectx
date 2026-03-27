namespace Backend.Application.Devices;

public interface IAttendanceLogSyncService
{
    Task<AttendanceLogSyncResult> SyncAllDevicesAsync(DateTime fromUtc, DateTime toUtc, CancellationToken cancellationToken);
}

public sealed record AttendanceLogSyncResult(int RecordsAdded, int DevicesProcessed, IReadOnlyList<string> Warnings);
