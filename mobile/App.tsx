import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useMemo, useState } from "react";
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView as NativeScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { api, clearSession, getSession, resolveImageUrl, saveSession } from "./src/api";

// TEMPORARILY DISABLED
// Mobile application development is currently on hold.
// Preserve the Android/iOS implementation for future activation.
const MOBILE_APP_FEATURE_ENABLED = false;

const C = {
  black: "#000",
  panel: "#11151d",
  panel2: "#171e29",
  border: "#283548",
  text: "#f5f7fa",
  muted: "#91a0b5",
  cyan: "#22d3ee",
  green: "#39FF88",
  red: "#C00035",
  purple: "#6B3FA0",
  orange: "#FF8A00",
  yellow: "#FFD21F",
};
type Tab = "Home" | "Calendar" | "Earnings" | "Menu";
const pad = (value: number) => String(value).padStart(2, "0");
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
const dateLabel = (value?: string) => {
  if (!value) return "Not provided";
  const [year, month, day] = String(value).slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
};
const timeLabel = (value?: string) => {
  if (!value) return "Not recorded";
  const [hour, minute] = String(value).slice(0, 5).split(":").map(Number);
  return `${pad(hour % 12 || 12)}:${pad(minute)} ${hour >= 12 ? "PM" : "AM"}`;
};
const durationLabel = (login?: string, logout?: string, now = new Date()) => {
  if (!login) return "00:00:00";
  const [hour, minute] = String(login).slice(0, 5).split(":").map(Number);
  const start = hour * 3600 + minute * 60;
  const end = logout
    ? String(logout)
        .slice(0, 8)
        .split(":")
        .map(Number)
        .reduce(
          (total, value, index) => total + value * [3600, 60, 1][index],
          0,
        )
    : now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const total = Math.max(0, end - start);
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor(total / 60) % 60)}:${pad(total % 60)}`;
};
const statusColor: Record<string, string> = {
  Present: C.green,
  Absent: C.red,
  WFH: "#1687FF",
  Halfday: "#F4F7FA",
  "On Site Work": C.yellow,
  "Paid Leave": C.purple,
  "Paid Holiday": "#FF8A00",
  Festival: "#FF2DB2",
};
const textStroke = (Platform.OS === "web"
  ? { WebkitTextStroke: "1px #000000" }
  : {}) as any;

const ScrollView = (props: React.ComponentProps<typeof NativeScrollView>) => (
  <NativeScrollView
    {...props}
    showsVerticalScrollIndicator={false}
    showsHorizontalScrollIndicator={false}
  />
);

if (
  Platform.OS === "web" &&
  typeof document !== "undefined" &&
  !document.getElementById("erv-hide-scrollbars")
) {
  const scrollbarStyles = document.createElement("style");
  scrollbarStyles.id = "erv-hide-scrollbars";
  scrollbarStyles.textContent = `
		html, body, #root, * {
			scrollbar-width: none;
			-ms-overflow-style: none;
		}
		html::-webkit-scrollbar,
		body::-webkit-scrollbar,
		#root::-webkit-scrollbar,
		*::-webkit-scrollbar {
			display: none;
			width: 0;
			height: 0;
		}
	`;
  document.head.appendChild(scrollbarStyles);
}

function Splash({ done }: { done: () => void }) {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const lift = React.useRef(new Animated.Value(0)).current;
  const scale = React.useRef(new Animated.Value(1)).current;
  const useNativeDriver = Platform.OS !== "web";
  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 1000, useNativeDriver }),
      Animated.parallel([
        Animated.timing(lift, { toValue: -70, duration: 850, useNativeDriver }),
        Animated.timing(scale, {
          toValue: 0.72,
          duration: 850,
          useNativeDriver,
        }),
      ]),
    ]).start(() => setTimeout(done, 180));
  }, []);
  return (
    <View style={s.splash}>
      <Animated.Image
        source={require("./assets/erv-logo.png")}
        resizeMode="contain"
        style={[
          s.logo,
          { opacity, transform: [{ translateY: lift }, { scale }] },
        ]}
      />
      <StatusBar style="light" />
    </View>
  );
}
function Login({
  enter,
}: {
  enter: (token: string, role: "employee" | "admin") => void;
}) {
  const [admin, setAdmin] = useState(false);
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const data = admin
        ? await api.adminLogin(identity, password)
        : await api.employeeLogin(identity, password);
      await saveSession(data.accessToken, admin ? "admin" : "employee");
      enter(data.accessToken, admin ? "admin" : "employee");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <KeyboardAvoidingView
      style={s.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.login}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={require("./assets/erv-logo.png")}
          style={s.loginLogo}
          resizeMode="contain"
        />
        <Text style={s.eyebrow}>EDGE ROUTE VISION</Text>
        <Text style={s.title}>{admin ? "Admin Login" : "Employee Login"}</Text>
        <Text style={s.muted}>Secure access to your ERV workspace.</Text>
        <TextInput
          style={s.input}
          placeholder={admin ? "Email" : "Employee ID"}
          placeholderTextColor={C.muted}
          value={identity}
          onChangeText={setIdentity}
          autoCapitalize="none"
        />
        <TextInput
          style={s.input}
          placeholder="Password"
          placeholderTextColor={C.muted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Pressable style={s.primary} onPress={submit} disabled={busy}>
          <Text style={s.primaryText}>{busy ? "Signing in..." : "Login"}</Text>
        </Pressable>
        {error ? <Text style={s.error}>{error}</Text> : null}
        <Pressable
          onPress={() => {
            setAdmin(!admin);
            setIdentity("");
            setPassword("");
            setError("");
          }}
        >
          <Text style={s.link}>{admin ? "Employee Login" : "Admin Login"}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
function Card({ children }: { children: React.ReactNode }) {
  return <View style={s.card}>{children}</View>;
}
function Header({ title: _title }: { title?: string }) {
  return (
    <View style={s.header}>
      <Image
        source={require("./assets/ERv.png")}
        resizeMode="contain"
        style={s.headerLogo}
      />
    </View>
  );
}
function HomeIcon({ active = false }: { active?: boolean }) {
  return <View style={s.homeIcon}><View style={[s.homeRoof, active && { backgroundColor: C.cyan }]} /><View style={[s.homeBody, active && { backgroundColor: C.cyan }]}><View style={s.homeDoor} /></View></View>;
}
function CalendarIcon({ active = false }: { active?: boolean }) {
  return <View style={[s.calendarIcon, active && { borderColor: C.cyan }]}><View style={[s.calendarTop, active && { backgroundColor: C.cyan }]}><View style={s.calendarRing} /><View style={s.calendarRing} /><View style={s.calendarRing} /></View><View style={s.calendarPaper}><View style={[s.calendarLine, active && { backgroundColor: C.cyan }]} /></View></View>;
}
function RupeeIcon({ active = false }: { active?: boolean }) { return <Text style={[s.rupeeIcon, active && s.iconTextActive]}>₹</Text>; }
function MenuIcon({ active = false }: { active?: boolean }) { return <View style={s.hamburgerIcon}><View style={[s.menuLine, active && { backgroundColor: C.cyan }]} /><View style={[s.menuLine, active && { backgroundColor: C.cyan }]} /><View style={[s.menuLine, active && { backgroundColor: C.cyan }]} /></View>; }
function Nav({
  active,
  setActive,
}: {
  active: Tab;
  setActive: (tab: Tab) => void;
}) {
  return (
    <View style={s.nav}>
      {(
        [
          ["Home", "Home"],
          ["Calendar", "Calendar"],
          ["Earnings", "Earnings"],
          ["Menu", "Menu"],
        ] as [Tab, string][]
      ).map(([tab, label]) => (
        <Pressable key={tab} onPress={() => setActive(tab)} style={s.navItem}>
          <View>{label === "Earnings" ? <RupeeIcon active={active === tab} /> : label === "Home" ? <HomeIcon active={active === tab} /> : label === "Calendar" ? <CalendarIcon active={active === tab} /> : <MenuIcon active={active === tab} />}</View>
          <Text style={[s.navText, active === tab && s.navSelected]}>
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
function Field({
  label,
  value,
  editable = false,
  onChangeText,
  secureTextEntry = false,
}: {
  label: string;
  value?: string;
  editable?: boolean;
  onChangeText?: (value: string) => void;
  secureTextEntry?: boolean;
}) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      {editable ? (
        <TextInput
          style={s.fieldInput}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
        />
      ) : (
        <Text style={s.fieldValue}>{value || "Not provided"}</Text>
      )}
    </View>
  );
}
function HomePanel({
  profile,
  row,
  clock,
  duty,
  message,
}: {
  profile: any;
  row: any;
  clock: Date;
  duty: (action: "start" | "logout") => void;
  message: string;
}) {
  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}>
      <Text style={s.greeting}>Welcome back</Text>
      <Card>
        <View style={s.profileTop}>
          <View style={s.profileCopy}>
            <Text style={s.name}>{profile?.full_name || "Employee"}</Text>
            <Text style={s.muted}>
              {profile?.email || "Email not provided"}
            </Text>
          </View>
          {profile?.profile_picture ? (
            <Image source={{ uri: resolveImageUrl(profile.profile_picture) }} style={s.avatar} />
          ) : (
            <View style={s.avatarPlaceholder}>
              <Text style={s.avatarText}>
                {String(profile?.full_name || "E")
                  .slice(0, 1)
                  .toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <Field label="Phone" value={profile?.phone} />
        <Field label="Role / Designation" value={profile?.role} />
        <Field label="Department" value={profile?.department} />
      </Card>
      <Card>
        <Text style={s.cardTitle}>Today</Text>
        <Text style={s.dateLarge}>{dateLabel(today())}</Text>
        <Text style={s.label}>Work Hours</Text>
        <Text style={s.timer}>
          {durationLabel(row?.login_time, row?.logout_time, clock)}
        </Text>
        <View style={s.actionRow}>
          <Pressable
            style={[s.actionButton, { backgroundColor: C.green }]}
            onPress={() => duty("start")}
          >
            <Text style={[s.actionText, textStroke]}>LOGIN</Text>
          </Pressable>
          <Pressable
            style={[s.actionButton, { backgroundColor: C.red }]}
            onPress={() => duty("logout")}
          >
            <Text style={[s.actionText, textStroke]}>LOGOUT</Text>
          </Pressable>
        </View>
        {row?.login_time ? (
          <Text style={s.muted}>
            Logged in at {timeLabel(row.login_time)}
            {row.logout_time
              ? `, logged out at ${timeLabel(row.logout_time)}`
              : ""}
            .
          </Text>
        ) : null}
      </Card>
      {message ? <Text style={s.notice}>{message}</Text> : null}
    </ScrollView>
  );
}
const statusLegend = [
  ["Present", C.green],
  ["Absent", C.red],
  ["WFH", "#1687FF"],
  ["Halfday", "#F4F7FA"],
  ["On Site Work", C.yellow],
  ["Paid Holiday", "#FF8A00"],
  ["Festival", "#FF2DB2"],
  ["Paid Leave", C.purple],
] as const;
function StatusLegend() {
  return (
    <View
      style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 }}
    >
      {statusLegend.map(([label, color]) => (
        <View
          key={label}
          style={{
            flexDirection: "row",
            alignItems: "center",
            width: "48%",
            minWidth: 120,
          }}
        >
          <View
            style={{
              width: 9,
              height: 9,
              borderRadius: 5,
              marginRight: 6,
              backgroundColor: color,
            }}
          />
          <Text style={{ color: C.muted, fontSize: 11 }}>{label}</Text>
        </View>
      ))}
    </View>
  );
}
function CalendarGrid({
  records,
  selected,
  setSelected,
  selectionColor,
  disablePast = false,
}: {
  records: any[];
  selected: string[];
  setSelected: (dates: string[]) => void;
  selectionColor?: string;
  disablePast?: boolean;
}) {
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const recordMap = useMemo(
    () =>
      Object.fromEntries(
        records.map((record) => [
          String(record.attendance_date).slice(0, 10),
          record.status,
        ]),
      ),
    [records],
  );
  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
    const count = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0,
    ).getDate();
    return [
      ...Array(first).fill(null),
      ...Array.from({ length: count }, (_, index) => index + 1),
    ];
  }, [month]);
  return (
    <Card>
      <View style={s.monthHeader}>
        <Pressable
          onPress={() =>
            setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
          }
        >
          <Text style={s.monthButton}>‹</Text>
        </Pressable>
        <Text style={s.cardTitle}>
          {month.toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          })}
        </Text>
        <Pressable
          onPress={() =>
            setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
          }
        >
          <Text style={s.monthButton}>›</Text>
        </Pressable>
      </View>
      <View style={s.weekRow}>
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <Text key={`${day}-${index}`} style={s.weekDay}>
            {day}
          </Text>
        ))}
      </View>
      <View style={s.calendarGrid}>
        {cells.map((day, index) => {
          if (!day) return <View key={`empty-${index}`} style={s.calendarCell} />;
          const key = `${month.getFullYear()}-${pad(month.getMonth() + 1)}-${pad(day)}`;
          const status = recordMap[key];
          const isSelected = selected.includes(key);
          const isSunday = new Date(month.getFullYear(), month.getMonth(), day).getDay() === 0;
          const isPast = disablePast && !isSunday && key < today();
          return (
            <Pressable
              key={key}
              disabled={isSunday || isPast}
              onPress={() =>
                setSelected(
                  isSelected
                    ? selected.filter((value) => value !== key)
                    : [...selected, key],
                )
              }
              style={[
                s.calendarCell,
                isPast && { opacity: 0.55 },
              ]}
            >
              <View
                style={[
                  s.calendarBubble,
                  isSelected &&
                  !status &&
                  (selectionColor
                    ? { backgroundColor: selectionColor }
                    : s.selectedDate),
                status && { backgroundColor: statusColor[status] || C.panel2 },
                  isPast && { backgroundColor: "#3a3f46" },
                  isSunday && { backgroundColor: C.orange },
                ]}
              >
                <Text style={[s.dayText, textStroke]}>{day}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <StatusLegend />
    </Card>
  );
}
function LeavePanel({
  token,
  leaves,
  refresh,
  selected,
  setSelected,
  type,
  setType,
}: {
  token: string;
  leaves: any[];
  refresh: () => Promise<void>;
  selected: string[];
  setSelected: (dates: string[]) => void;
  type: "unpaid" | "paid" | "";
  setType: (type: "unpaid" | "paid" | "") => void;
}) {
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!selected.length || !type) return;
    setBusy(true);
    try {
      await api.createLeave(token, selected, type);
      setSelected([]);
      setType("");
      await refresh();
    } finally {
      setBusy(false);
    }
  };
  const cancel = async (id: string) => {
    setBusy(true);
    try {
      await api.cancelLeave(token, id);
      await refresh();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card>
      <Text style={s.cardTitle}>Leave Request</Text>
      <Text style={s.muted}>Selected: {selected.length} days</Text>
      <Text style={s.muted}>
        Leave Type:{" "}
        {type === "paid"
          ? "Paid Leave"
          : type === "unpaid"
            ? "Normal Leave"
            : "Choose a type"}
      </Text>
      <View style={s.actionRow}>
        <Pressable
          style={[s.choiceButton, { borderColor: C.red }]}
          onPress={() => setType("unpaid")}
        >
          <Text style={s.choiceText}>Request Leave</Text>
        </Pressable>
        <Pressable
          style={[s.choiceButton, { borderColor: C.purple }]}
          onPress={() => setType("paid")}
        >
          <Text style={s.choiceText}>Request Paid Leave</Text>
        </Pressable>
      </View>
      <Pressable
        style={[s.primary, (!selected.length || !type) && s.disabled]}
        disabled={!selected.length || !type || busy}
        onPress={submit}
      >
        <Text style={s.primaryText}>
          {busy ? "Submitting..." : "Submit Request"}
        </Text>
      </Pressable>
      {leaves.map((item) => (
        <View key={item.id} style={s.request}>
          <Pressable disabled={busy} onPress={() => cancel(item.id)}>
            <Text style={s.link}>Cancel Request</Text>
          </Pressable>
        </View>
      ))}
    </Card>
  );
}
function CalendarPanel({
  token,
  records,
  leaves,
  refresh,
}: {
  token: string;
  records: any[];
  leaves: any[];
  refresh: () => Promise<void>;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [type, setType] = useState<"unpaid" | "paid" | "">("");
  const approvedLeaveRecords = leaves.flatMap((request) =>
    (request.dates || [])
      .filter((date: any) => date.status === "Approved")
      .map((date: any) => ({
        attendance_date: date.date,
        status: request.leave_type === "paid" ? "Paid Leave" : "Absent",
      })),
  );
  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}>
      <Text style={s.greeting}>Calendar</Text>
      <Text style={s.sectionLabel}>Attendance Calendar</Text>
      <CalendarGrid
        records={records}
        selected={[]}
        setSelected={() => undefined}
      />
      <Text style={s.sectionLabel}>Leave Request Calendar</Text>
      <CalendarGrid
        records={approvedLeaveRecords}
        selected={selected}
        setSelected={setSelected}
        disablePast
        selectionColor={
          type === "paid" ? C.purple : type === "unpaid" ? C.red : undefined
        }
      />
      <LeavePanel
        token={token}
        leaves={leaves}
        refresh={refresh}
        selected={selected}
        setSelected={setSelected}
        type={type}
        setType={setType}
      />
    </ScrollView>
  );
}
function EarningsPanel({ payroll }: { payroll: any }) {
  const values: [string, string][] = [
    ["Basic Pay", `Rs ${Number(payroll?.basicSalary || 0).toFixed(2)}`],
    ["Daily Pay", `Rs ${Number(payroll?.dailySalary || 0).toFixed(2)}`],
    ["Days Present", String(payroll?.counts?.Present ?? 0)],
    ["Days Absent", String(payroll?.counts?.Absent ?? 0)],
    ["Half Days", String(payroll?.counts?.Halfday ?? 0)],
    ["WFH", String(payroll?.counts?.WFH ?? 0)],
    ["On Site Work", String(payroll?.counts?.["On Site Work"] ?? 0)],
    ["Paid Holidays", String(payroll?.counts?.["Paid Holidays"] ?? 0)],
    ["Festival", String(payroll?.counts?.Festival ?? 0)],
    ["Paid Leave", String(payroll?.counts?.["Paid Leave"] ?? 0)],
    ["Total Paid Days", Number(payroll?.paidDays || 0).toFixed(2)],
    ["Updated Till", payroll?.updatedTillDisplay || "Not started"],
  ];
  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}>
      <Text style={s.greeting}>Salary & Earnings</Text>
      <Card>
        <Text style={s.label}>Current Earnings</Text>
        <Text style={s.earnings}>
          Rs {Number(payroll?.earnings || 0).toFixed(2)}
        </Text>
        {values.map(([label, value]) => (
          <View key={label} style={s.stat}>
            <Text style={s.muted}>{label}</Text>
            <Text style={s.text}>{value}</Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}
function SettingsPanel({
  token,
  profile,
  setProfile,
  onSaved,
}: {
  token: string;
  profile: any;
  setProfile: (value: any) => void;
  onSaved: (message: string) => void;
}) {
  const [email, setEmail] = useState(profile?.email || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [photoUri, setPhotoUri] = useState(profile?.profile_picture || "");
  const [photoChanged, setPhotoChanged] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const changed =
    email !== (profile?.email || "") ||
    phone !== (profile?.phone || "") ||
    photoChanged ||
    Boolean(currentPassword || newPassword);
  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      onSaved("Photo permission is required to change your profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setPhotoChanged(true);
    }
  };
  const save = async () => {
    setBusy(true);
    try {
      let next = profile;
      if (email !== (profile?.email || "") || phone !== (profile?.phone || ""))
        next = await api.updateProfile(token, { email, phone });
      if (photoChanged) next = await api.updatePicture(token, photoUri);
      if (currentPassword || newPassword)
        await api.changePassword(token, currentPassword, newPassword);
      setProfile(next);
      setPhotoChanged(false);
      setCurrentPassword("");
      setNewPassword("");
      onSaved("Profile changes saved.");
    } catch (err) {
      onSaved(err instanceof Error ? err.message : "Unable to save changes.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}>
      <Text style={s.greeting}>Edit Profile</Text>
      <View style={s.editPhoto}>
        <Pressable
          onPress={pickPhoto}
          accessibilityLabel="Change profile photo"
        >
          {photoUri ? (
            <Image source={{ uri: resolveImageUrl(photoUri) }} style={s.editAvatar} />
          ) : (
            <View style={[s.editAvatar, s.avatarPlaceholder]}>
              <Text style={s.avatarText}>
                {String(profile?.full_name || "E")
                  .slice(0, 1)
                  .toUpperCase()}
              </Text>
            </View>
          )}
          <View style={s.pencil}>
            <Text style={s.pencilText}>✎</Text>
          </View>
        </Pressable>
        <Text style={s.muted}>Profile Photo</Text>
      </View>
      <Card>
        <Field label="Email" value={email} editable onChangeText={setEmail} />
        <Field label="Phone" value={phone} editable onChangeText={setPhone} />
        <Field label="Joining Date" value={dateLabel(profile?.joining_date)} />
        <Field
          label="Basic Salary"
          value={`Rs ${Number(profile?.basic_salary || 0).toFixed(2)}`}
        />
        <Field label="Role" value={profile?.role} />
        <Field label="Department" value={profile?.department} />
        <Field label="Status" value={profile?.status} />
        <Text style={s.sectionLabel}>Change Password</Text>
        <Field
          label="Current Password"
          value={currentPassword}
          editable
          onChangeText={setCurrentPassword}
          secureTextEntry
        />
        <Field
          label="New Password"
          value={newPassword}
          editable
          onChangeText={setNewPassword}
          secureTextEntry
        />
        <Pressable
          style={[s.primary, (!changed || busy) && s.disabled]}
          disabled={!changed || busy}
          onPress={save}
        >
          <Text style={s.primaryText}>
            {busy ? "Saving..." : "Save Changes"}
          </Text>
        </Pressable>
      </Card>
    </ScrollView>
  );
}
function MenuPanel({
  onSettings,
  onSignOut,
}: {
  onSettings: () => void;
  onSignOut: () => void;
}) {
  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}>
      <Text style={s.greeting}>Menu</Text>
      <Card>
        <Pressable style={s.menuItem} onPress={onSettings}>
          <Text style={s.text}>Settings</Text>
          <Text style={s.chevron}>›</Text>
        </Pressable>
        <Pressable style={s.menuItem} onPress={onSignOut}>
          <Text style={s.text}>Sign Out</Text>
          <Text style={s.chevron}>›</Text>
        </Pressable>
      </Card>
    </ScrollView>
  );
}
function EmployeeApp({
  token,
  signOut,
}: {
  token: string;
  signOut: () => void;
}) {
  const [profile, setProfile] = useState<any>();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [payroll, setPayroll] = useState<any>();
  const [tab, setTab] = useState<Tab>("Home");
  const [message, setMessage] = useState("");
  const [clock, setClock] = useState(new Date());
  const [settings, setSettings] = useState(false);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const refresh = async () => {
    const [p, a, l, pay] = await Promise.all([
      api.employeeProfile(token),
      api.attendance(token),
      api.leaves(token),
      api.payroll(token),
    ]);
    setProfile(p);
    setAttendance(a || []);
    setLeaves(l || []);
    setPayroll(pay);
  };
  useEffect(() => {
    refresh().catch((err) => setMessage(err.message));
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const row = attendance.find(
    (item) => String(item.attendance_date).slice(0, 10) === today(),
  );
  const duty = async (action: "start" | "logout") => {
    try {
      const saved = await api.duty(action, token);
      setAttendance((current) => [
        saved,
        ...current.filter(
          (item) => String(item.attendance_date).slice(0, 10) !== today(),
        ),
      ]);
      setMessage(
        `Successfully ${action === "start" ? "logged in" : "logged out"} at ${timeLabel(action === "start" ? saved.login_time : saved.logout_time)}.`,
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Duty action failed.");
    }
  };
  const title = settings ? "Settings" : tab;
  const panel = settings ? (
    <SettingsPanel
      token={token}
      profile={profile}
      setProfile={setProfile}
      onSaved={() => {
        setSettings(false);
        setTab("Menu");
      }}
    />
  ) : tab === "Home" ? (
    <HomePanel
      profile={profile}
      row={row}
      clock={clock}
      duty={duty}
      message={message}
    />
  ) : tab === "Calendar" ? (
    <CalendarPanel
      token={token}
      records={attendance}
      leaves={leaves}
      refresh={refresh}
    />
  ) : tab === "Earnings" ? (
    <EarningsPanel payroll={payroll} />
  ) : (
    <MenuPanel
      onSettings={() => setSettings(true)}
      onSignOut={() => setConfirmingSignOut(true)}
    />
  );
  return (
    <SafeAreaView style={s.screen}>
      <View style={s.mobileFrame}>
        <Header title={title} />
        <Nav
          active={settings ? "Menu" : tab}
          setActive={(value) => {
            setSettings(false);
            setTab(value);
          }}
        />
        {panel}
        {confirmingSignOut && (
          <View style={s.modalBackdrop}>
            <View style={s.modal}>
              <Text style={s.cardTitle}>
                Are you sure you want to sign out?
              </Text>
              <Pressable style={s.primary} onPress={signOut}>
                <Text style={s.primaryText}>CONFIRM</Text>
              </Pressable>
              <Pressable
                style={s.linkButton}
                onPress={() => setConfirmingSignOut(false)}
              >
                <Text style={s.link}>STAY LOGGED IN</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
function AdminApp({ token, signOut }: { token: string; signOut: () => void }) {
  const [section, setSection] = useState("dashboard");
  const [employees, setEmployees] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [festivals, setFestivals] = useState<any[]>([]);
  const [moduleRecords, setModuleRecords] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [festivalDate, setFestivalDate] = useState("");
  const [festivalName, setFestivalName] = useState("Festival");
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const load = async () => {
    const [leaveData, employeeData, festivalData] = await Promise.all([
      api.adminLeaves(token),
      api.adminEmployees(token),
      api.adminFestivals(token),
    ]);
    setRequests(leaveData || []);
    setEmployees(employeeData || []);
    setFestivals(festivalData || []);
  };
  useEffect(() => {
    load().catch((err) => setMessage(err.message));
  }, []);
  useEffect(() => {
    const paths: Record<string, string> = { gallery: "/gallery", products: "/products?admin=true", projects: "/projects?admin=true", careers: "/careers?showAll=true", clients: "/clients" };
    if (!paths[section]) return;
    api.adminCollection(token, paths[section]).then((data) => setModuleRecords(Array.isArray(data) ? data : data?.items || data?.products || data?.projects || data?.careers || data?.clients || [])).catch((err) => setMessage(err.message));
  }, [section, token]);
  const decide = async (id: string, status: "Approved" | "Rejected") => {
    try {
      await api.decideLeave(token, id, status);
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Decision failed.");
    }
  };
  const addFestival = async () => {
    try {
      await api.addFestival(token, festivalDate, festivalName);
      setFestivalDate("");
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to add festival.");
    }
  };
  const removeFestival = async (id: string) => {
    try {
      await api.removeFestival(token, id);
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to remove festival.");
    }
  };
  const deleteHistory = async (id: string) => {
    try {
      await api.deleteLeaveHistory(token, id);
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to delete request history.");
    }
  };
  const deleteAllHistory = async () => {
    try {
      await api.deleteAllLeaveHistory(token);
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to delete request history.");
    }
  };
  const changePassword = async () => {
    try {
      await api.adminChangePassword(token, currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Password updated.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to update password.");
    }
  };
  const options = [
    ["gallery", "Gallery", "▣"], ["products", "Products", "□"],
    ["projects", "Previous Projects", "◈"], ["careers", "Careers", "◆"],
    ["clients", "Clients", "●"], ["social", "Social Media", "↗"],
    ["employees", "Employees", "♙"], ["workforce", "Festivals & Leave", "!"],
    ["settings", "Settings", "⚙"],
  ] as const;
  const renderSection = () => {
    if (section === "employees") return <ScrollView style={s.scroll} contentContainerStyle={s.content}><Text style={s.greeting}>Employees</Text>{employees.map((employee) => <Card key={employee.id}><Text style={s.cardTitle}>{employee.full_name}</Text><Text style={s.muted}>{employee.employee_id} · {employee.role || "No role"}</Text><Text style={s.muted}>{employee.department || "No department"} · {employee.status || "Active"}</Text></Card>)}</ScrollView>;
    if (section === "workforce") return <ScrollView style={s.scroll} contentContainerStyle={s.content}><Text style={s.greeting}>Festivals & Leave</Text><Card><Text style={s.cardTitle}>Add Festival</Text><TextInput style={s.input} placeholder="YYYY-MM-DD" placeholderTextColor={C.muted} value={festivalDate} onChangeText={setFestivalDate} /><TextInput style={s.input} placeholder="Festival name" placeholderTextColor={C.muted} value={festivalName} onChangeText={setFestivalName} /><Pressable style={s.primary} onPress={addFestival}><Text style={s.primaryText}>Add Festival</Text></Pressable>{festivals.map((festival) => <View key={festival.id} style={s.request}><Text style={s.text}>{festival.festival_date || festival.date} · {festival.name || "Festival"}</Text><Pressable onPress={() => removeFestival(festival.id)}><Text style={s.error}>Delete</Text></Pressable></View>)}</Card><Card><View style={s.adminRow}><Text style={s.cardTitle}>Leave Requests</Text><Pressable onPress={deleteAllHistory}><Text style={s.error}>Delete All</Text></Pressable></View>{requests.map((request) => <View key={request.id} style={s.request}><Text style={s.text}>{request.full_name || request.employee_code}</Text>{request.dates.map((date: any) => <View key={date.id}><Text style={s.muted}>{dateLabel(date.date)} · {date.status}</Text>{date.status === "Pending" && <View style={s.actionRow}><Pressable onPress={() => decide(date.id, "Approved")}><Text style={s.link}>Approve</Text></Pressable><Pressable onPress={() => decide(date.id, "Rejected")}><Text style={s.error}>Reject</Text></Pressable></View>}</View>)}<Pressable onPress={() => deleteHistory(request.id)}><Text style={s.error}>Delete History</Text></Pressable></View>)}</Card></ScrollView>;
    if (section === "settings") return <ScrollView style={s.scroll} contentContainerStyle={s.content}><Text style={s.greeting}>Settings</Text><Card><Text style={s.cardTitle}>Change Password</Text><TextInput style={s.input} placeholder="Current password" placeholderTextColor={C.muted} secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} /><TextInput style={s.input} placeholder="New password" placeholderTextColor={C.muted} secureTextEntry value={newPassword} onChangeText={setNewPassword} /><Pressable style={s.primary} onPress={changePassword}><Text style={s.primaryText}>Change Password</Text></Pressable></Card><Card><Pressable onPress={() => setConfirmingSignOut(true)}><Text style={s.error}>Sign Out</Text></Pressable></Card></ScrollView>;
    if (section !== "dashboard") return <ScrollView style={s.scroll} contentContainerStyle={s.content}><Text style={s.greeting}>{options.find(([id]) => id === section)?.[1]}</Text>{moduleRecords.map((record, index) => <Card key={record.id || record.slug || index}><Text style={s.cardTitle}>{record.name || record.title || record.full_name || record.position || record.heading || "Record"}</Text><Text style={s.muted}>{record.description || record.email || record.role || record.status || record.category_name || ""}</Text></Card>)}</ScrollView>;
    return <ScrollView style={s.scroll} contentContainerStyle={s.content}><Text style={s.greeting}>Admin Dashboard</Text><View style={s.adminGrid}>{options.map(([id, label, icon]) => <Pressable key={id} style={s.adminCard} onPress={() => setSection(id)}><View style={s.adminIcon}><Text style={s.adminIconText}>{icon}</Text></View><Text style={s.adminLabel}>{label}</Text>{id === "workforce" && requests.some((request) => request.request_status === "Pending") && <View style={s.badge}><Text style={s.badgeText}>{requests.filter((request) => request.request_status === "Pending").length}</Text></View>}</Pressable>)}</View></ScrollView>;
  };
  return (
    <SafeAreaView style={s.screen}>
      <View style={s.mobileFrame}>
        <Header title="Admin" />
        {section !== "dashboard" && <Pressable style={s.adminBack} onPress={() => setSection("dashboard")}><Text style={s.link}>‹ Back to Dashboard</Text></Pressable>}
        {renderSection()}
        {message ? <Text style={s.error}>{message}</Text> : null}
        {confirmingSignOut && <View style={s.modalBackdrop}><View style={s.modal}><Text style={s.cardTitle}>Are you sure you want to sign out?</Text><Pressable style={s.primary} onPress={signOut}><Text style={s.primaryText}>CONFIRM</Text></Pressable><Pressable style={s.linkButton} onPress={() => setConfirmingSignOut(false)}><Text style={s.link}>STAY LOGGED IN</Text></Pressable></View></View>}
      </View>
    </SafeAreaView>
  );
}
export default function App() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<{
    token: string;
    role: "employee" | "admin";
  } | null>(null);
  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.documentElement.style.cssText =
        "width:100%;height:100dvh;margin:0;overflow:hidden";
      document.body.style.cssText =
        "width:100%;height:100%;margin:0;overflow:hidden;background:#171a20";
      const root = document.getElementById("root");
      if (root)
        root.style.cssText =
          "width:100%;height:100dvh;min-width:0;overflow:hidden";
    }
    getSession().then((saved) => {
      if (saved.token && (saved.role === "employee" || saved.role === "admin"))
        setSession({ token: saved.token, role: saved.role });
      setReady(true);
    });
  }, []);
  const signOut = async () => {
    await clearSession();
    setSession(null);
  };
  if (!MOBILE_APP_FEATURE_ENABLED) {
    return (
      <View style={[s.appRoot, Platform.OS === "web" && s.webPreview]}>
        <View style={s.splash}>
          <Text style={s.title}>Mobile app temporarily paused</Text>
          <Text style={s.muted}>The Android/iOS implementation is on hold while the web employee profile remains active.</Text>
        </View>
      </View>
    );
  }
  if (!MOBILE_APP_FEATURE_ENABLED) {
    return (
      <View style={[s.appRoot, Platform.OS === "web" && s.webPreview]}>
        <View style={s.splash}>
          <Text style={s.title}>Mobile app temporarily paused</Text>
          <Text style={s.muted}>The Android/iOS implementation is on hold while the web employee profile remains active.</Text>
        </View>
      </View>
    );
  }

  if (!ready)
    return (
      <View style={s.mobileFrame}>
        <Splash done={() => undefined} />
      </View>
    );
  return (
    <View style={[s.appRoot, Platform.OS === "web" && s.webPreview]}>
      {session ? (
        session.role === "employee" ? (
          <EmployeeApp token={session.token} signOut={signOut} />
        ) : (
          <AdminApp token={session.token} signOut={signOut} />
        )
      ) : (
        <Login enter={(token, role) => setSession({ token, role })} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  appRoot: { flex: 1, width: "100%", minWidth: 0, backgroundColor: C.black },
  webPreview: {
    alignSelf: "center",
    marginLeft: "auto",
    marginRight: "auto",
    width: "100%",
    maxWidth: 430,
    height: "100%",
    backgroundColor: C.black,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#2d3542",
  },
  mobileFrame: {
    flex: 1,
    width: "100%",
    minWidth: 0,
    backgroundColor: C.black,
    overflow: "hidden",
  },
  screen: { flex: 1, width: "100%", minWidth: 0, backgroundColor: C.black },
  splash: {
    flex: 1,
    backgroundColor: C.black,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: "82%", maxWidth: 340, height: 240 },
  scroll: { flex: 1, width: "100%" },
  content: { width: "100%", padding: 16, paddingBottom: 32 },
  login: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    justifyContent: "center",
    padding: 24,
  },
  loginLogo: { width: "70%", maxWidth: 270, height: 125, alignSelf: "center" },
  header: {
    height: 76,
    width: "100%",
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.black,
  },
  headerLogo: { width: 132, height: 58 },
  headerTitle: { color: C.text, fontSize: 18, fontWeight: "800" },
  eyebrow: {
    color: C.cyan,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  title: { color: C.text, fontSize: 28, fontWeight: "800", marginTop: 8 },
  greeting: {
    color: C.text,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 14,
  },
  sectionLabel: {
    color: C.cyan,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 4,
  },
  muted: { color: C.muted, marginTop: 5, flexShrink: 1 },
  card: {
    width: "100%",
    backgroundColor: C.panel,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  profileTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  profileCopy: { flex: 1, minWidth: 0 },
  name: { color: C.text, fontSize: 20, fontWeight: "800" },
  avatar: { width: 64, height: 64, borderRadius: 32, marginLeft: 14, borderWidth: 1, borderColor: "#fff" },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginLeft: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.cyan,
  },
  avatarText: { color: "#041014", fontSize: 26, fontWeight: "900" },
  editPhoto: { alignItems: "center", marginBottom: 14 },
  editAvatar: { width: 112, height: 112, borderRadius: 56, borderWidth: 2, borderColor: C.cyan },
  pencil: { position: "absolute", right: -4, bottom: 4, width: 30, height: 30, borderRadius: 15, backgroundColor: C.cyan, alignItems: "center", justifyContent: "center" },
  pencilText: { color: "#041014", fontSize: 18, fontWeight: "900" },
  cardTitle: { color: C.text, fontSize: 17, fontWeight: "800" },
  dateLarge: { color: C.cyan, fontSize: 18, fontWeight: "700", marginTop: 8 },
  label: { color: C.muted, marginTop: 18, fontSize: 13 },
  timer: {
    color: C.green,
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 4,
  },
  actionRow: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    minWidth: 130,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  actionText: { color: "#fff", fontWeight: "900" },
  notice: {
    color: C.cyan,
    backgroundColor: "#102630",
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  nav: {
    width: "100%",
    minHeight: 68,
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 4,
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: "#0b1017",
  },
  navItem: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  navIcon: { color: C.muted, fontSize: 20, lineHeight: 22, fontWeight: "800" },
  navText: { color: C.muted, fontSize: 10, fontWeight: "800", marginTop: 2 },
  navSelected: { color: C.cyan },
  iconTextActive: { color: C.cyan },
  homeIcon: { width: 22, height: 22, alignItems: "center", justifyContent: "flex-end" },
  homeRoof: { position: "absolute", top: 1, width: 16, height: 16, backgroundColor: C.muted, transform: [{ rotate: "45deg" }], borderRadius: 2 },
  homeBody: { width: 18, height: 13, backgroundColor: C.muted, borderRadius: 2, alignItems: "center", justifyContent: "flex-end" },
  homeDoor: { width: 5, height: 8, backgroundColor: "#0b1017", borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  calendarIcon: { width: 22, height: 20, borderWidth: 2, borderColor: C.muted, borderRadius: 4, overflow: "hidden" },
  calendarTop: { height: 5, backgroundColor: C.muted, flexDirection: "row", justifyContent: "space-around" },
  calendarRing: { width: 2, height: 5, backgroundColor: "#0b1017" },
  calendarPaper: { flex: 1, backgroundColor: "transparent" },
  calendarLine: { height: 2, marginTop: 6, marginHorizontal: 3, backgroundColor: C.muted },
  rupeeIcon: { color: C.muted, fontSize: 22, lineHeight: 22, fontWeight: "800" },
  hamburgerIcon: { width: 22, height: 22, justifyContent: "center", gap: 4 },
  menuLine: { width: 21, height: 2, borderRadius: 1, backgroundColor: C.muted },
  input: {
    width: "100%",
    backgroundColor: C.panel,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 10,
    color: C.text,
    padding: 15,
    marginTop: 12,
  },
  primary: {
    width: "100%",
    backgroundColor: C.cyan,
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 16,
  },
  primaryText: { color: "#041014", fontWeight: "900" },
  disabled: { opacity: 0.4 },
  link: {
    color: C.cyan,
    textAlign: "center",
    marginTop: 18,
    fontWeight: "800",
  },
  linkButton: { width: "100%", alignItems: "center" },
  error: { color: C.red, marginTop: 12, flexShrink: 1 },
  field: { marginBottom: 14 },
  fieldLabel: { color: C.muted, fontSize: 12, marginBottom: 5 },
  fieldValue: {
    color: "#708096",
    backgroundColor: "#0b0f15",
    borderRadius: 8,
    padding: 12,
  },
  fieldInput: {
    color: C.text,
    backgroundColor: C.panel2,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  monthButton: { color: C.cyan, fontSize: 30, paddingHorizontal: 10 },
  weekRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekDay: {
    color: C.muted,
    width: `${100 / 7}%`,
    textAlign: "center",
    fontWeight: "800",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  calendarCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
  },
  calendarBubble: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.panel2,
  },
  selectedDate: {
    backgroundColor: "transparent",
    borderColor: "#fff",
    borderWidth: 1,
    borderStyle: "dotted",
  },
  dayText: { color: C.text, fontSize: 12, fontWeight: "800" },
  legend: { color: C.muted, fontSize: 11, marginTop: 14, lineHeight: 16 },
  choiceButton: {
    flexGrow: 1,
    flexBasis: 140,
    borderWidth: 1,
    borderRadius: 9,
    padding: 12,
    alignItems: "center",
  },
  choiceText: { color: C.text, fontWeight: "800", textAlign: "center" },
  request: {
    borderTopColor: C.border,
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 12,
  },
  adminGrid: { flexDirection: "row", flexWrap: "wrap", width: "100%" },
  adminCard: { width: "25%", minHeight: 112, alignItems: "center", justifyContent: "flex-start", backgroundColor: "transparent", padding: 6, position: "relative" },
  adminIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.panel2, borderWidth: 1, borderColor: C.cyan, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  adminIconText: { color: C.cyan, fontSize: 22, fontWeight: "800" },
  adminLabel: { color: C.text, fontSize: 12, fontWeight: "800", textAlign: "center" },
  badge: { position: "absolute", top: 8, right: 8, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: C.red, alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "900" },
  adminBack: { paddingHorizontal: 16, paddingTop: 8 },
  adminRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  signoutButton: { alignItems: "center", marginTop: 12 },
  text: { color: C.text, fontSize: 15, flexShrink: 1 },
  earnings: {
    color: C.green,
    fontSize: 36,
    fontWeight: "900",
    marginVertical: 12,
  },
  stat: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    borderTopColor: C.border,
    borderTopWidth: 1,
    paddingVertical: 10,
  },
  menuItem: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomColor: C.border,
    borderBottomWidth: 1,
  },
  menuIcon: { color: C.cyan, width: 48, fontSize: 12, fontWeight: "800" },
  chevron: { color: C.muted, fontSize: 26, marginLeft: "auto" },
  signout: { color: C.muted, textAlign: "center", padding: 16 },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "#000b",
    justifyContent: "center",
    paddingHorizontal: 24,
    zIndex: 20,
  },
  modal: {
    width: "100%",
    maxWidth: 382,
    alignSelf: "center",
    backgroundColor: C.panel,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 20,
  },
});
