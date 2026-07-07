import { useEffect, useMemo, useRef, useState } from "react";
import ActivitySelector from "./components/ActivitySelector";
import AdminPanel from "./components/AdminPanel";
import EmptyState from "./components/EmptyState";
import PinModal from "./components/PinModal";
import QuickCheckin from "./components/QuickCheckin";
import SummaryDashboard from "./components/SummaryDashboard";
import UserVerificationModal from "./components/UserVerificationModal";
import UserWelcome from "./components/UserWelcome";
import UserCheckin from "./components/UserCheckin";
import { activities, getActivityById } from "./config/activities";
import { Role } from "./config/permissions";
import { ActivityConfig, CheckinRecord } from "./types/checkin";
import { cancelCheckInRecord, checkInRecord, ensureCheckinColumns, findRecordsByPhone, getActivityWindowStatus, isActivityOpen } from "./utils/checkin";
import { exportExcel, importExcel, importExcelBuffer } from "./utils/excel";
import { isRemoteSyncEnabled, loadRemoteRecords, saveRemoteRecords } from "./utils/remoteSync";
import {
  loadRecords,
  loadRole,
  loadSelectedActivity,
  loadUatMode,
  loadUatNow,
  loadUserPhone,
  saveRecords,
  saveRole,
  saveSelectedActivity,
  saveUatMode,
  saveUatNow,
  saveUserPhone,
} from "./utils/storage";

export default function App() {
  const [records, setRecords] = useState<CheckinRecord[]>(() => loadRecords());
  const [uatRecords, setUatRecords] = useState<CheckinRecord[]>(() => loadRecords());
  const [role, setRole] = useState<Role>(() => loadRole());
  const [selectedActivityId, setSelectedActivityId] = useState<string | undefined>(() => loadSelectedActivity());
  const [showPin, setShowPin] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [pendingCheckinId, setPendingCheckinId] = useState<string | undefined>();
  const [userPhone, setUserPhone] = useState(() => loadUserPhone());
  const [uatMode, setUatMode] = useState(() => loadUatMode());
  const [uatNow, setUatNow] = useState(() => loadUatNow());
  const [toast, setToast] = useState("");
  const recordsRef = useRef(records);
  const selectedActivity = useMemo(() => getActivityById(selectedActivityId), [selectedActivityId]);
  const activeRecords = uatMode ? uatRecords : records;
  const effectiveNow = uatMode && uatNow ? new Date(uatNow) : new Date();
  const userRecords = useMemo(() => findRecordsByPhone(activeRecords, userPhone), [activeRecords, userPhone]);
  const pendingCheckinPerson = useMemo(
    () => activeRecords.find((record) => String(record.Checkin_ID) === pendingCheckinId),
    [activeRecords, pendingCheckinId],
  );

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    recordsRef.current = records;
  }, [records]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const forceUpload = params.get("uploadDatabase") === "1";

    const uploadBundledDatabase = async () => {
      try {
        if (isRemoteSyncEnabled && !forceUpload) {
          try {
            const remote = await loadRemoteRecords();
            if (remote.records.length > 0) {
              persistRecords(remote.records, { remote: false });
              setToast("Da dong bo du lieu chung.");
              return;
            }

            if (records.length > 0) {
              await saveRemoteRecords(records);
              setToast("Da dua du lieu len kho chung.");
              return;
            }
          } catch (error) {
            setToast(error instanceof Error ? error.message : "Chua ket noi duoc kho du lieu chung.");
          }
        }

        if (!forceUpload && records.length > 0) return;

        const response = await fetch("/database.xlsx", { cache: "no-store" });
        if (!response.ok) throw new Error("Database file not found");
        const result = importExcelBuffer(await response.arrayBuffer());
        persistRecords(result.records);
        setSelectedActivityId(undefined);
        saveSelectedActivity(undefined);
        if (forceUpload) {
          params.delete("uploadDatabase");
          const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
          window.history.replaceState({}, "", nextUrl);
        }
        setToast(result.warning || `Da tai du lieu: ${result.records.length} dong.`);
      } catch {
        if (forceUpload) setToast("Khong upload duoc database.");
      }
    };

    uploadBundledDatabase();
    // Auto-load the bundled database for first-time visitors on the deployed site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isRemoteSyncEnabled || uatMode) return;

    let stopped = false;
    const pollRemoteRecords = async () => {
      try {
        const remote = await loadRemoteRecords();
        if (!stopped && remote.records.length > 0 && JSON.stringify(remote.records) !== JSON.stringify(recordsRef.current)) {
          setRecords(remote.records);
          saveRecords(remote.records);
          setUatRecords(remote.records);
          recordsRef.current = remote.records;
        }
      } catch {
        // Keep the local copy usable if the network is temporarily unavailable.
      }
    };

    const timer = window.setInterval(pollRemoteRecords, 5000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [uatMode]);

  const persistRecords = (nextRecords: CheckinRecord[], options: { remote?: boolean } = {}) => {
    setRecords(nextRecords);
    saveRecords(nextRecords);
    setUatRecords(nextRecords);
    recordsRef.current = nextRecords;

    if (options.remote !== false && isRemoteSyncEnabled) {
      void saveRemoteRecords(nextRecords).catch((error) => setToast(error instanceof Error ? error.message : "Chua dong bo duoc du lieu chung."));
    }
  };

  const persistActiveRecords = (nextRecords: CheckinRecord[]) => {
    if (uatMode) {
      setUatRecords(nextRecords);
      return;
    }

    persistRecords(nextRecords);
  };

  const enterAdmin = () => {
    setRole("admin");
    saveRole("admin");
    setShowPin(false);
    setToast("Đã vào Admin.");
  };

  const logoutAdmin = () => {
    setRole("staff");
    saveRole("staff");
    setSelectedActivityId(undefined);
    saveSelectedActivity(undefined);
    setShowReport(false);
    setToast("Đã thoát Admin.");
  };

  const selectActivity = (activityId: string) => {
    setSelectedActivityId(activityId);
    saveSelectedActivity(activityId);
    setShowReport(false);
  };

  const goBack = () => {
    setSelectedActivityId(undefined);
    saveSelectedActivity(undefined);
  };

  const handleImport = async (file: File) => {
    try {
      const result = await importExcel(file);
      persistRecords(result.records);
      setSelectedActivityId(undefined);
      saveSelectedActivity(undefined);
      setToast(result.warning || `Đã import ${result.records.length} dòng dữ liệu.`);
    } catch {
      setToast("Không đọc được file Excel.");
    }
  };

  const handleCheckIn = (id: string) => {
    setPendingCheckinId(id);
  };

  const setWindowBlockedToast = (activity: ActivityConfig) => {
    const status = getActivityWindowStatus(activity, effectiveNow);
    setToast(status === "closed" ? "Đã quá thời gian check-in cho hoạt động này." : "Chưa đến thời gian check-in cho hoạt động này.");
  };

  const confirmCheckIn = (verifiedBy: string) => {
    if (!selectedActivity) return;
    if (!isActivityOpen(selectedActivity, effectiveNow)) {
      setPendingCheckinId(undefined);
      setWindowBlockedToast(selectedActivity);
      return;
    }
    persistActiveRecords(
      activeRecords.map((record) =>
        String(record.Checkin_ID) === pendingCheckinId ? checkInRecord(record, selectedActivity, verifiedBy, effectiveNow) : record,
      ),
    );
    setPendingCheckinId(undefined);
    setToast(uatMode ? "UAT: đã mô phỏng check-in, không lưu dữ liệu chính." : "Đã xác thực và check-in thành công.");
  };

  const handleUserPhoneSubmit = (phone: string) => {
    const normalized = phone.trim();
    setUserPhone(normalized);
    saveUserPhone(normalized);
    if (!findRecordsByPhone(activeRecords, normalized).length) {
      setToast("Không tìm thấy thông tin phù hợp với số điện thoại này.");
    }
  };

  const changeUserPhone = () => {
    setUserPhone("");
    saveUserPhone(undefined);
  };

  const handleUserCheckIn = (personId: string, activity: ActivityConfig) => {
    if (!isActivityOpen(activity, effectiveNow)) {
      setWindowBlockedToast(activity);
      return;
    }

    persistActiveRecords(
      activeRecords.map((record) =>
        String(record.Checkin_ID) === personId ? checkInRecord(record, activity, "Xác thực bằng SĐT", effectiveNow) : record,
      ),
    );
    setToast(uatMode ? "UAT: đã mô phỏng check-in, không lưu dữ liệu chính." : "Đã check-in thành công.");
  };

  const handleCancel = (id: string) => {
    if (role !== "admin" || !selectedActivity) return;
    persistActiveRecords(activeRecords.map((record) => (String(record.Checkin_ID) === id ? cancelCheckInRecord(record, selectedActivity) : record)));
    setToast(uatMode ? "UAT: đã hủy trên bản test, không lưu dữ liệu chính." : "Đã hủy check-in.");
  };

  const handleUpdateProfile = (id: string, updates: Partial<CheckinRecord>) => {
    if (role !== "admin") return;
    persistActiveRecords(activeRecords.map((record) => (String(record.Checkin_ID) === id ? { ...record, ...updates } : record)));
    setToast(uatMode ? "UAT: đã cập nhật hồ sơ trên bản test." : "Đã cập nhật hồ sơ.");
  };

  const handleReset = () => {
    const resetRecords = activeRecords.map((record) => {
      const next: CheckinRecord = { ...record };
      activities.forEach((activity) => {
        next[activity.checkField] = false;
        next[activity.timeField] = "";
      });
      next.Lan_checkin_cuoi = "";
      next.Nguoi_checkin_cuoi = "";
      next.Xac_thuc_checkin_cuoi = "";
      return next;
    });
    persistActiveRecords(ensureCheckinColumns(resetRecords));
    setToast(uatMode ? "UAT: đã reset bản test, dữ liệu chính không đổi." : "Đã reset toàn bộ check-in.");
  };

  const toggleUatMode = () => {
    const next = !uatMode;
    setUatMode(next);
    saveUatMode(next);
    if (next) {
      setUatRecords(records);
      setSelectedActivityId(undefined);
      saveSelectedActivity(undefined);
      setToast("Đã bật UAT: check-in chỉ ghi trên bản test, không lưu dữ liệu chính.");
    } else {
      setUatRecords(records);
      setToast("Đã tắt UAT: quay về dữ liệu chính.");
    }
  };

  const changeUatNow = (value: string) => {
    setUatNow(value);
    saveUatNow(value);
  };

  const useRealTimeForUat = () => {
    setUatNow("");
    saveUatNow(undefined);
    setToast("UAT đang dùng giờ thật của hệ thống.");
  };

  const content = () => {
    if (role !== "admin") {
      if (!userPhone) {
        return <UserWelcome hasData={activeRecords.length > 0} onSubmit={handleUserPhoneSubmit} />;
      }

      return (
        <UserCheckin
          phone={userPhone}
          people={userRecords}
          allRecords={activeRecords}
          onCheckIn={handleUserCheckIn}
          onChangePhone={changeUserPhone}
          currentTime={effectiveNow}
          uatMode={uatMode}
        />
      );
    }

    if (showReport) {
      return role === "admin" ? (
        <SummaryDashboard role={role} records={activeRecords} onReset={handleReset} onUpdateProfile={handleUpdateProfile} />
      ) : (
        <EmptyState title="Bạn không có quyền xem báo cáo." />
      );
    }

    if (selectedActivity) {
      return (
        <QuickCheckin
          records={activeRecords}
          activity={selectedActivity}
          role={role}
          onBack={goBack}
          onCheckIn={handleCheckIn}
          onCancel={handleCancel}
          onUpdateProfile={handleUpdateProfile}
        />
      );
    }

    if (!activeRecords.length) {
      return role === "admin" ? (
        <EmptyState title="Vui lòng import file Excel." detail="File nên có sheet Checkin_App." />
      ) : (
        <EmptyState title="Chưa có dữ liệu. Vui lòng liên hệ BTC." />
      );
    }

    return <ActivitySelector records={activeRecords} onSelect={selectActivity} currentTime={effectiveNow} />;
  };

  return (
    <div className="min-h-screen bg-[#f6f7f2]">
      <AdminPanel
        role={role}
        onOpenPin={() => setShowPin(true)}
        onLogout={logoutAdmin}
        onImport={handleImport}
        onExport={() => exportExcel(records)}
        onToggleReport={() => {
          if (role !== "admin") {
            setToast("Bạn không có quyền xem báo cáo.");
            return;
          }
          setShowReport((value) => !value);
          setSelectedActivityId(undefined);
          saveSelectedActivity(undefined);
        }}
        showReport={showReport}
        uatMode={uatMode}
        uatNow={uatNow}
        onToggleUat={toggleUatMode}
        onUatNowChange={changeUatNow}
        onUseRealTime={useRealTimeForUat}
      />

      <main className="safe-bottom mx-auto max-w-5xl px-4 py-5">
        <header className="mb-5 pr-20">
          <p className="text-xs font-black uppercase tracking-wider text-brand-700">CHECK-IN XE & SỰ KIỆN DU LỊCH</p>
          <h1 className="mt-2 text-2xl font-black leading-tight text-stone-950 sm:text-3xl">
            {role === "admin" ? "Điểm danh nhanh theo hoạt động" : "Tự check-in theo số điện thoại"}
          </h1>
        </header>
        {uatMode ? (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">
            UAT đang bật: mọi thao tác check-in chỉ ghi trên bản test, không lưu vào dữ liệu chính.
            <span className="mt-1 block font-black">
              Thời gian kiểm thử: {uatNow ? new Intl.DateTimeFormat("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              }).format(effectiveNow) : "giờ thật của hệ thống"}
            </span>
          </div>
        ) : null}
        {content()}
      </main>

      {toast ? (
        <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-lg bg-stone-950 px-4 py-3 text-center text-sm font-bold text-white shadow-xl">
          {toast}
        </div>
      ) : null}

      {showPin ? <PinModal onClose={() => setShowPin(false)} onSuccess={enterAdmin} /> : null}
      {pendingCheckinPerson && selectedActivity ? (
        <UserVerificationModal
          person={pendingCheckinPerson}
          activity={selectedActivity}
          onClose={() => setPendingCheckinId(undefined)}
          onConfirm={confirmCheckIn}
        />
      ) : null}
    </div>
  );
}
