import { debounce, nowIso } from "./utils.js";
import { saveLocalState } from "./storage-service.js";
import { loadCloudState, saveCloudState, subscribeCloudState } from "./firebase-service.js";

export function isCloudNewer(cloud, local) {
  if (!cloud?.lastChangedAt) return false;
  if (!local?.lastChangedAt) return true;
  return new Date(cloud.lastChangedAt).getTime() > new Date(local.lastChangedAt).getTime();
}

export function makeSyncController({ getState, setState, setSyncStatus, render }) {
  let uid = null;
  let unsubscribe = null;
  let applyingRemote = false;

  const debouncedPush = debounce(async () => {
    if (!uid) return;
    try {
      setSyncStatus("syncing", "Syncing…");
      const state = { ...getState(), lastSyncedAt: nowIso() };
      await saveCloudState(uid, state);
      setState(state, { silent: true });
      saveLocalState(state);
      setSyncStatus("synced", "Synced");
      render();
    } catch (error) {
      console.warn("Cloud save failed", error);
      setSyncStatus("warn", "Saved locally");
      render();
    }
  }, 900);

  return {
    async connect(newUid) {
      uid = newUid;
      try {
        setSyncStatus("syncing", "Checking cloud…");
        const local = getState();
        const cloud = await loadCloudState(uid);
        if (cloud && isCloudNewer(cloud, local)) {
          applyingRemote = true;
          setState({ ...local, ...cloud }, { remote: true });
          saveLocalState(getState());
          applyingRemote = false;
        } else if (!cloud || isCloudNewer(local, cloud)) {
          await saveCloudState(uid, { ...local, lastSyncedAt: nowIso() });
        }
        if (unsubscribe) unsubscribe();
        unsubscribe = await subscribeCloudState(uid, remoteState => {
          if (applyingRemote) return;
          const localState = getState();
          if (isCloudNewer(remoteState, localState) && remoteState.deviceId !== localState.deviceId) {
            setState({ ...localState, ...remoteState }, { remote: true });
            saveLocalState(getState());
            setSyncStatus("synced", "Synced from another device");
            render();
          }
        }, error => {
          console.warn("Cloud subscription failed", error);
          setSyncStatus("warn", "Local only");
          render();
        });
        setSyncStatus("synced", "Synced");
        render();
      } catch (error) {
        console.warn("Cloud connect failed", error);
        setSyncStatus("warn", "Local only");
        render();
      }
    },
    disconnect() {
      uid = null;
      if (unsubscribe) unsubscribe();
      unsubscribe = null;
      setSyncStatus("local", "Local only");
      render();
    },
    markChanged() {
      if (!uid) return;
      debouncedPush();
    },
    forcePush: debouncedPush
  };
}
