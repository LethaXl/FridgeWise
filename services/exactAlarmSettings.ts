import { NativeModules, Platform } from "react-native";

type ExactAlarmSettingsModule = {
  canScheduleExactAlarms: () => Promise<boolean>;
  openSettings: () => Promise<boolean>;
};

const ExactAlarmSettings = NativeModules.ExactAlarmSettings as
  | ExactAlarmSettingsModule
  | undefined;

export async function canScheduleExactAlarms(): Promise<boolean> {
  if (Platform.OS !== "android") return true;
  if (!ExactAlarmSettings?.canScheduleExactAlarms) return false;

  try {
    return await ExactAlarmSettings.canScheduleExactAlarms();
  } catch {
    return false;
  }
}

export async function openExactAlarmSettings(): Promise<boolean> {
  if (Platform.OS !== "android") return false;
  if (!ExactAlarmSettings?.openSettings) return false;

  try {
    return await ExactAlarmSettings.openSettings();
  } catch {
    return false;
  }
}
