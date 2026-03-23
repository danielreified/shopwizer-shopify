import { useEffect } from "react";
import type { ReactNode } from "react";
import { useAppStore } from "../store/app-store";

export interface SettingsSaveState {
  isDirty: boolean;
  onSave?: () => void;
  isLoading: boolean;
  rightPane?: ReactNode;
  hideRightPane?: boolean;
}

export function useSettingsSaveState(
  state: SettingsSaveState,
  cleanupOverride?: Partial<SettingsSaveState>
) {
  const setSettingsState = useAppStore((s) => s.setSettingsState);

  useEffect(() => {
    setSettingsState(state);

    return () =>
      setSettingsState({
        isDirty: false,
        onSave: undefined,
        isLoading: false,
        rightPane: undefined,
        hideRightPane: undefined,
        ...cleanupOverride,
      });
  }, [
    state.isDirty,
    state.onSave,
    state.isLoading,
    state.rightPane,
    state.hideRightPane,
    setSettingsState,
    cleanupOverride,
  ]);
}
