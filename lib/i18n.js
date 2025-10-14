// lib/i18n.js
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";

// Your messages
const translations = {
  en: {
    profile: "Profile",
    personalInfo: "Personal Info",
    security: "Security",
    account: "Account",
    preferences:"Travel & Preferences",
    name: "Name",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    phone: "Phone",
    language: "Language",
    save: "Save",
    cancel: "Cancel",
    chooseLanguage: "Choose language",
    addPhone: "Add phone",
    editName: "Edit name",
    editEmail: "Edit email",
    editPhone: "Edit phone",
  },
  bn: {
    profile: "প্রোফাইল",
    personalInfo: "ব্যক্তিগত তথ্য",
    security: "নিরাপত্তা",
    account: "অ্যাকাউন্ট",
    preferences: "ট্রাভেল ও পছন্দসমূহ",
    name: "নাম",
    firstName: "প্রথম নাম",
    lastName: "শেষ নাম",
    email: "ইমেইল",
    phone: "ফোন",
    language: "ভাষা",
    save: "সেভ",
    cancel: "বাতিল",
    chooseLanguage: "ভাষা নির্বাচন করুন",
    addPhone: "ফোন যোগ করুন",
    editName: "নাম পরিবর্তন",
    editEmail: "ইমেইল পরিবর্তন",
    editPhone: "ফোন পরিবর্তন",
  },
};

// Create an instance
const i18n = new I18n(translations);

// Defaults
i18n.defaultLocale = "en";
// Use only the language code part (e.g., "en", "bn")
i18n.locale = (Localization.locale || "en").split("-")[0];
i18n.enableFallback = true;

export default i18n;
