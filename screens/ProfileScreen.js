// screens/ProfileScreen.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, Image, TouchableOpacity, Alert, Platform,
  ActionSheetIOS, Modal, Pressable, ScrollView, Animated
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import FloatingBar from "../components/FloatingBar";
import theme from "../lib/theme";
import { useAuth } from "../hooks/useAuth";
import { useLang } from "../hooks/useLang";

const AVATAR_KEY = "profile.avatar.uri";
const STORE_KEY = "profile.info";

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { lang } = useLang();

  const [avatarUri, setAvatarUri] = useState(null);
  const [pendingUri, setPendingUri] = useState(null);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [merged, setMerged] = useState({ name: user?.name || "", email: user?.email || "" });

  const initials = useMemo(() => {
    const n = merged?.name || "";
    const parts = n.trim().split(/\s+/);
    return parts.slice(0, 2).map(p => p[0]?.toUpperCase() || "").join("");
  }, [merged?.name]);

  useEffect(() => { (async () => {
    try { const saved = await AsyncStorage.getItem(AVATAR_KEY); if (saved) setAvatarUri(saved); } catch {}
  })(); }, []);

  useFocusEffect(useCallback(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORE_KEY);
        const saved = raw ? JSON.parse(raw) : {};
        const m = { name: saved.name ?? user?.name ?? "", email: saved.email ?? user?.email ?? "" };
        if (alive) setMerged(m);
      } catch {}
    })();
    return () => { alive = false; };
  }, [user?.name, user?.email, lang]));

  async function askCamera(){ const {status}=await ImagePicker.requestCameraPermissionsAsync(); return status==="granted"; }
  async function askLibrary(){ const {status}=await ImagePicker.requestMediaLibraryPermissionsAsync(); return status==="granted"; }
  async function takePhoto(){ try{ if(!(await askCamera())){Alert.alert("Permission needed","Please allow camera access.");return;}
    const res=await ImagePicker.launchCameraAsync({allowsEditing:true,aspect:[1,1],quality:0.9,mediaTypes:ImagePicker.MediaTypeOptions.Images});
    if(!res.canceled&&res.assets?.[0]?.uri){ setPendingUri(res.assets[0].uri); setPreviewOpen(true);} }catch(e){Alert.alert("Camera error",String(e?.message??e));}}
  async function chooseFromGallery(){ try{ if(!(await askLibrary())){Alert.alert("Permission needed","Please allow photos access.");return;}
    const res=await ImagePicker.launchImageLibraryAsync({allowsEditing:true,aspect:[1,1],quality:0.9,mediaTypes:ImagePicker.MediaTypeOptions.Images});
    if(!res.canceled&&res.assets?.[0]?.uri){ setPendingUri(res.assets[0].uri); setPreviewOpen(true);} }catch(e){Alert.alert("Gallery error",String(e?.message??e));}}
  async function recrop(){ try{ if(!(await askLibrary())){Alert.alert("Permission needed","Please allow photos access.");return;}
    const res=await ImagePicker.launchImageLibraryAsync({allowsEditing:true,aspect:[1,1],quality:0.95,mediaTypes:ImagePicker.MediaTypeOptions.Images});
    if(!res.canceled&&res.assets?.[0]?.uri){ setPendingUri(res.assets[0].uri);} }catch(e){Alert.alert("Crop error",String(e?.message??e));}}
  async function saveAvatar(){ if(!pendingUri) return; try{ await AsyncStorage.setItem(AVATAR_KEY,pendingUri); setAvatarUri(pendingUri); setPendingUri(null); setPreviewOpen(false);}catch(e){Alert.alert("Save failed",String(e?.message??e));}}
  async function removeAvatar(){ try{ await AsyncStorage.removeItem(AVATAR_KEY); setAvatarUri(null); setPendingUri(null); setPreviewOpen(false);}catch(e){Alert.alert("Remove failed",String(e?.message??e));}}

  function openAvatarActions(){
    if(Platform.OS==="ios"){
      ActionSheetIOS.showActionSheetWithOptions(
        { options:["Take Photo","Choose from Library", avatarUri?"Remove Photo":"Cancel", avatarUri?"Cancel":undefined].filter(Boolean),
          destructiveButtonIndex: avatarUri?2:undefined,
          cancelButtonIndex: avatarUri?3:2 },
        async (idx)=>{ if(idx===0) await takePhoto(); else if(idx===1) await chooseFromGallery(); else if(avatarUri&&idx===2) await removeAvatar(); }
      );
    } else setChooserOpen(true);
  }

  function onLogout(){ logout(); navigation.navigate("Login"); }

  if(!user){
    return(<View style={[styles.container,{alignItems:"center",justifyContent:"center"}]}><Text style={{fontSize:16,color:theme.colors.muted}}>No user</Text></View>);
  }

  return (
    <LinearGradient
      colors={["#F7FAFF", "#F9F6FF", "#FFF9F0"]}
      start={{x:0, y:0}}
      end={{x:1, y:1}}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={["#9EE1FF", "#C3B9FF", "#FFE29A"]}
          start={{x:0, y:0}}
          end={{x:1, y:1}}
          style={styles.cover}
        >
          <TouchableOpacity onPress={openAvatarActions} activeOpacity={0.9} style={styles.avatarWrap}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.initials}>{initials || "?"}</Text>
              </View>
            )}
            <View style={styles.cameraBadge}><Ionicons name="camera" size={16} color="#fff" /></View>
          </TouchableOpacity>
          <Text style={styles.name}>{merged.name}</Text>
          <Text style={styles.roleText}>{user.role || "Rider"}</Text>
        </LinearGradient>

        {/* Details card */}
        <View style={styles.card}>
          <Row icon={<MaterialIcons name="email" size={20} color={theme.colors.muted} />} label="Email" value={merged.email} />
          {!!user.createdAt && (
            <Row icon={<Ionicons name="calendar" size={20} color={theme.colors.muted} />} label="Member since" value={new Date(user.createdAt).toLocaleDateString()} />
          )}
        </View>

        {/* Quick nav buttons */}
        <View style={styles.quickRow}>
          <QuickBtn icon="person-circle-outline" label="Personal Info"
            onPress={() => navigation.navigate("ProfileHub", { screen: "Tabs", params: { tab: "Personal" } })} />
          <QuickBtn icon="shield-checkmark-outline" label="Security"
            onPress={() => navigation.navigate("ProfileHub", { screen: "Tabs", params: { tab: "Security" } })} />
          <QuickBtn icon="wallet-outline" label="Account"
            onPress={() => navigation.navigate("ProfileHub", { screen: "Tabs", params: { tab: "Account" } })} />
          {/* NEW: Preferences quick link */}
          <QuickBtn icon="options-outline" label="Preferences"
            onPress={() => navigation.navigate("ProfileHub", { screen: "Tabs", params: { tab: "Preferences" } })} />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.btnSecondary} onPress={openAvatarActions} activeOpacity={0.9}>
            <Ionicons name="image" size={18} color={theme.colors.primary} />
            <Text style={styles.btnSecondaryText}>Change Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnDanger} onPress={onLogout} activeOpacity={0.9}>
            <Ionicons name="log-out-outline" size={18} color="#fff" />
            <Text style={styles.btnDangerText}>Log out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Android sheet */}
      <Modal visible={chooserOpen} transparent animationType="fade" onRequestClose={() => setChooserOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setChooserOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>Profile photo</Text>
            <SheetBtn icon="camera-outline" label="Take Photo" onPress={async () => { setChooserOpen(false); await takePhoto(); }} />
            <SheetBtn icon="image-outline" label="Choose from Gallery" onPress={async () => { setChooserOpen(false); await chooseFromGallery(); }} />
            {avatarUri ? <SheetBtn icon="trash-outline" label="Remove Photo" destructive onPress={async () => { setChooserOpen(false); await removeAvatar(); }} /> : null}
            <SheetBtn icon="close-circle-outline" label="Cancel" onPress={() => setChooserOpen(false)} />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Preview modal */}
      <Modal visible={previewOpen} transparent animationType="slide" onRequestClose={() => { setPendingUri(null); setPreviewOpen(false); }}>
        <View style={styles.previewWrap}>
          <View style={styles.previewCard}>
            <Text style={styles.sheetTitle}>Preview</Text>
            {pendingUri ? <Image source={{ uri: pendingUri }} style={styles.previewImage} /> : null}
            <View style={styles.previewBtns}>
              <TouchableOpacity style={[styles.smallBtn, styles.btnGhost]} onPress={recrop}>
                <Ionicons name="crop-outline" size={18} color="#1f2937" />
                <Text style={styles.btnGhostTxt}>Crop</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
              <TouchableOpacity style={[styles.smallBtn, styles.btnPrimary]} onPress={async ()=>{ await saveAvatar(); }}>
                <Ionicons name="save-outline" size={18} color="#fff" />
                <Text style={styles.btnPrimaryTxt}>Save</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.smallBtn, { marginTop: 8 }]} onPress={() => { setPendingUri(null); setPreviewOpen(false); }}>
              <Text style={{ fontWeight: "700", color: "#6b7280" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <FloatingBar navigation={navigation} />
    </LinearGradient>
  );
}

function QuickBtn({ icon, label, onPress }) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.95}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
        style={styles.quickBtnOuter}
      >
        <LinearGradient
          colors={["#EEF7FF", "#F2EEFF", "#FFF3D6"]}
          start={{x:0, y:0}}
          end={{x:1, y:1}}
          style={styles.quickBtn}
        >
          <View style={styles.quickLeft}>
            <Ionicons name={icon} size={20} color={theme.colors.primary} />
            <Text style={styles.quickTxt}>{label}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

function Row({ icon, label, value }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue} numberOfLines={1}>{value || "-"}</Text>
      </View>
    </View>
  );
}

function SheetBtn({ icon, label, destructive, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.sheetBtn, destructive && { backgroundColor: "#fee2e2" }]} activeOpacity={0.9}>
      <Ionicons name={icon} size={18} color={destructive ? "#b91c1c" : "#1f2937"} />
      <Text style={[styles.sheetBtnTxt, destructive && { color: "#b91c1c" }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* HEADER */
  cover: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 74,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 8,
  },
  avatarWrap: { alignSelf: "center", marginTop: 4 },
  avatar: {
    width: 110, height: 110, borderRadius: 999, borderWidth: 3,
    borderColor: "rgba(255,255,255,0.85)", backgroundColor: "#f2f2f2"
  },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  initials: { fontSize: 38, fontWeight: "800", color: "#4f4f4f" },
  cameraBadge: {
    position: "absolute", right: 0, bottom: 0, backgroundColor: "#2F80ED",
    width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#fff", elevation: 4
  },
  name: { marginTop: 12, textAlign: "center", fontSize: 22, fontWeight: "800", color: "#0f172a" },
  roleText: { textAlign: "center", color: "#1f2937", marginTop: 2, opacity: 0.8 },

  /* CARD */
  card: {
    marginTop: -42, marginHorizontal: 16, borderRadius: 18, paddingVertical: 10, paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.9)", borderWidth: 1, borderColor: "rgba(15,23,42,0.06)",
    shadowColor: "#000", shadowOpacity: 0.08, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 6,
  },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(2,6,23,0.06)" },
  rowIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#f3f6ff", alignItems: "center", justifyContent: "center", marginRight: 12 },
  rowLabel: { fontSize: 12, color: theme.colors.muted, marginBottom: 3 },
  rowValue: { fontSize: 15, color: theme.colors.text, fontWeight: "700" },

  /* QUICK BUTTONS */
  quickRow: { marginTop: 16, paddingHorizontal: 16, gap: 12 },
  quickBtnOuter: {
    borderRadius: 14,
    shadowColor: "#000", shadowOpacity: 0.08, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 5,
  },
  quickBtn: {
    borderRadius: 14, borderWidth: 1, borderColor: "rgba(59,130,246,0.15)",
    paddingVertical: 14, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  quickLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  quickTxt: { color: theme.colors.primary, fontWeight: "800", fontSize: 14 },

  /* ACTIONS */
  actions: { marginTop: 16, paddingHorizontal: 16, gap: 12, marginBottom: 20 },
  btnSecondary: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(59,130,246,0.06)", borderWidth: 1, borderColor: "rgba(59,130,246,0.2)",
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12
  },
  btnSecondaryText: { color: theme.colors.primary, fontWeight: "800", fontSize: 14 },
  btnDanger: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: theme.colors.error, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 },
  btnDangerText: { color: "#fff", fontWeight: "800", fontSize: 14 },

  /* SHEETS & PREVIEW */
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.25)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 14 },
  sheetTitle: { fontWeight: "800", marginBottom: 8, fontSize: 16 },
  sheetBtn: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 4, borderRadius: 10 },
  sheetBtnTxt: { fontWeight: "700", color: "#1f2937" },

  previewWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.25)", alignItems: "center", justifyContent: "center", padding: 18 },
  previewCard: { width: "100%", backgroundColor: "#fff", borderRadius: 14, padding: 14 },
  previewImage: { width: "100%", height: 280, borderRadius: 12, resizeMode: "cover", backgroundColor: "#f1f5f9" },
  previewBtns: { marginTop: 12, flexDirection: "row", alignItems: "center", gap: 10 },

  smallBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
  btnGhost: { backgroundColor: "#f5f7fb" },
  btnGhostTxt: { color: "#1f2937", fontWeight: "700" },
  btnPrimary: { backgroundColor: theme.colors.primary },
  btnPrimaryTxt: { color: "#fff", fontWeight: "800" },
});
