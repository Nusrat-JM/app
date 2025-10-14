// payments/PaymentsScreen.js

import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  FlatList,
  SafeAreaView,
  Alert,
  Platform,
} from "react-native";

/**
 * Props (optional):
 * - initialBalance: number (default 120.0)
 * - tokenBalance: number (default 250)
 * - tokenValue: number (value per token in app currency, default 0.1)
 * - estimatedFare: number (default 15.0)
 * - onApplyTokens: function({ tokensToUse, discountAmount }) => Promise
 * - onPay: function({ payWithTokens, tokenAmountUsed, finalAmount }) => Promise
 * - currencySymbol: string (default "$")
 */

// as its dummy so i have already given some values for all users


export default function PaymentScreen({
  initialBalance = 120.0,
  tokenBalance = 250,
  tokenValue = 0.1,
  estimatedFare = 15.0,
  currencySymbol = "৳",
  onApplyTokens = null,
  onPay = null,
}) {
  const [useTokens, setUseTokens] = useState(true);
  const [tokensToUse, setTokensToUse] = useState(0);
  const [balance, setBalance] = useState(initialBalance);
  const [tokens, setTokens] = useState(tokenBalance);
  const [history, setHistory] = useState([
    { id: "h1", title: "Earned from ride", tokens: 30, date: "2025-09-30" },
    { id: "h2", title: "Referral bonus", tokens: 50, date: "2025-09-25" },
    { id: "h3", title: "Used for discount", tokens: -20, date: "2025-09-20" },
  ]);
  const [expirySoon, setExpirySoon] = useState(40);
  const [isApplying, setIsApplying] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  // derived values
  const maxTokensApplicable = useMemo(() => {
    const maxByFare = Math.floor(estimatedFare / tokenValue);
    return Math.min(tokens, maxByFare);
  }, [tokens, estimatedFare, tokenValue]);

  const discountAmount = useMemo(() => {
    const t = Math.max(0, Number(tokensToUse) || 0);
    return Math.min(t * tokenValue, estimatedFare);
  }, [tokensToUse, tokenValue, estimatedFare]);

  const finalAmount = useMemo(() => {
    return Math.max(0, estimatedFare - discountAmount);
  }, [estimatedFare, discountAmount]);

  useEffect(() => {
    const defaultTokens = Math.min(
      maxTokensApplicable,
      Math.floor((estimatedFare * 0.2) / tokenValue)
    );
    setTokensToUse(defaultTokens);
  }, [maxTokensApplicable, estimatedFare, tokenValue]);

  // handlers
  async function handleApplyTokens() {
    if (!useTokens) {
      Alert.alert("Tokens disabled", "Turn on the toggle to use tokens.");
      return;
    }
    const t = parseInt(tokensToUse, 10) || 0;
    if (t <= 0) {
      Alert.alert("Invalid tokens", "Enter a token amount greater than 0.");
      return;
    }
    if (t > tokens) {
      Alert.alert("Not enough tokens", "You don't have that many tokens.");
      return;
    }

    setIsApplying(true);
    try {
      if (onApplyTokens) {
        await onApplyTokens({ tokensToUse: t, discountAmount: t * tokenValue });
      } else {
        Alert.alert(
          "Preview applied",
          `Using ${t} tokens will give ${currencySymbol}${(t * tokenValue).toFixed(2)} discount.`
        );
      }
    } catch (err) {
      console.warn("apply tokens error", err);
      Alert.alert("Error", "Couldn't apply tokens. Try again.");
    } finally {
      setIsApplying(false);
    }
  }

  async function handlePay() {
    setIsPaying(true);
    try {
      const tokenUsed = useTokens ? Math.max(0, parseInt(tokensToUse, 10) || 0) : 0;
      const payPayload = {
        payWithTokens: tokenUsed > 0,
        tokenAmountUsed: tokenUsed,
        finalAmount,
      };

      if (onPay) {
        await onPay(payPayload);
      } else {
        // Frontend-only mock behavior
        const newTokens = Math.max(0, tokens - tokenUsed);
        const newBalance = Math.max(0, balance - finalAmount);
        setTokens(newTokens);
        setBalance(newBalance);
        setHistory((h) => [
          { id: "h" + Date.now(), title: "Paid ride (wallet)", tokens: -tokenUsed, date: today() },
          ...h,
        ]);
        Alert.alert(
          "Payment successful",
          `Paid ${currencySymbol}${finalAmount.toFixed(2)}. Tokens used: ${tokenUsed}.`
        );
      }
    } catch (err) {
      console.warn("pay error", err);
      Alert.alert("Payment failed", "Please try a different payment method.");
    } finally {
      setIsPaying(false);
    }
  }

  function today() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  function renderHistoryItem({ item }) {
    const positive = item.tokens > 0;
    return (
      <View style={styles.historyItem}>
        <View style={{ flex: 1 }}>
          <Text style={styles.historyTitle}>{item.title}</Text>
          <Text style={styles.historyDate}>{item.date}</Text>
        </View>
        <Text style={[styles.historyTokens, { color: positive ? "#2ecc71" : "#e74c3c" }]}>
          {positive ? "+" : ""}
          {item.tokens} tk
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Wallet summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Wallet Balance</Text>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.balanceText}>
                {currencySymbol}
                {balance.toFixed(2)}
              </Text>
              <Text style={styles.subText}>{tokens} tokens available</Text>
            </View>
            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => {
                setBalance((b) => b + 10);
                Alert.alert("Top-up", `${currencySymbol}10 added to your wallet (demo).`);
              }}
            >
              <Text style={styles.quickBtnText}>Top-up</Text>
            </TouchableOpacity>
          </View>

          {/* Expiry banner */}
          {expirySoon > 0 && (
            <View style={styles.expiryBanner}>
              <Text style={styles.expiryText}>
                {expirySoon} tokens expiring soon — use them on your next ride!
              </Text>
            </View>
          )}
        </View>

        {/* Estimated fare & token controls */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Checkout</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.fareLabel}>Estimated Fare</Text>
            <Text style={styles.fareAmount}>
              {currencySymbol}
              {estimatedFare.toFixed(2)}
            </Text>
          </View>

          <View style={styles.tokenRow}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Switch value={useTokens} onValueChange={setUseTokens} />
              <Text style={styles.tokenLabel}>Use tokens</Text>
            </View>

            <TouchableOpacity
              style={styles.refBtn}
              onPress={() => {
                const bonus = 50;
                setTokens((t) => t + bonus);
                setHistory((h) => [
                  { id: "h" + Date.now(), title: "Referral bonus", tokens: bonus, date: today() },
                  ...h,
                ]);
                Alert.alert("Referral", `You received ${bonus} tokens (demo).`);
              }}
            >
              <Text style={styles.refText}>Get referral</Text>
            </TouchableOpacity>
          </View>

          {/* Token input(we are giving free token as user will click and get it) */}
          <View style={styles.tokenInputRow}>
            <TextInput
              keyboardType="number-pad"
              value={String(tokensToUse)}
              onChangeText={(t) => {
                const num = t.replace(/[^0-9]/g, "");
                const asNum = Math.min(Number(num || 0), maxTokensApplicable);
                setTokensToUse(asNum);
              }}
              placeholder="Tokens to use"
              style={styles.tokenInput}
              editable={useTokens}
              selectTextOnFocus={true}
            />
            <TouchableOpacity
              style={styles.maxBtn}
              onPress={() => setTokensToUse(maxTokensApplicable)}
            >
              <Text style={styles.maxBtnText}>Max</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.smallText}>
              Token value: {currencySymbol}
              {tokenValue.toFixed(2)} each
            </Text>
            <Text style={styles.smallText}>Max applicable: {maxTokensApplicable} tokens</Text>
          </View>

          {/* Preview */}
          <View style={styles.preview}>
            <Text style={styles.previewText}>
              Discount: {currencySymbol}
              {discountAmount.toFixed(2)}
            </Text>
            <Text style={styles.previewText}>
              Final: {currencySymbol}
              {finalAmount.toFixed(2)}
            </Text>
          </View>

          <View style={styles.rowBtns}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.applyBtn]}
              onPress={handleApplyTokens}
              disabled={isApplying}
            >
              <Text style={styles.actionBtnText}>{isApplying ? "Applying..." : "Preview"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.payBtn]}
              onPress={handlePay}
              disabled={isPaying}
            >
              <Text style={styles.actionBtnText}>{isPaying ? "Processing..." : "Pay"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* History list */}
        <View style={[styles.card, { flex: 1 }]}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Token History</Text>
            <TouchableOpacity
              onPress={() => {
                setHistory([]);
                Alert.alert("Cleared", "History cleared (demo).");
              }}
            >
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={history}
            keyExtractor={(i) => i.id}
            renderItem={renderHistoryItem}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={<Text style={styles.emptyText}>No history yet.</Text>}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Platform.OS === "ios" ? "#0f1720" : "#0f1720",
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#0f1720",
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    color: "#e5e7eb",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceText: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
  },
  subText: {
    color: "#9ca3af",
    marginTop: 4,
  },
  quickBtn: {
    backgroundColor: "#1f2937",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  quickBtnText: {
    color: "#e5e7eb",
    fontWeight: "600",
  },
  expiryBanner: {
    marginTop: 12,
    backgroundColor: "#f59e0b",
    padding: 8,
    borderRadius: 8,
  },
  expiryText: {
    color: "#1f2937",
    fontWeight: "600",
  },
  fareLabel: {
    color: "#9ca3af",
    fontSize: 14,
  },
  fareAmount: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },
  tokenRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tokenLabel: {
    color: "#e5e7eb",
    marginLeft: 8,
    fontSize: 15,
  },
  refBtn: {
    padding: 8,
  },
  refText: {
    color: "#60a5fa",
    fontWeight: "600",
  },
  tokenInputRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  tokenInput: {
    flex: 1,
    backgroundColor: "#0b1220",
    borderColor: "#1f2937",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    color: "#fff",
  },
  maxBtn: {
    marginLeft: 8,
    backgroundColor: "#0b1220",
    borderColor: "#374151",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  maxBtnText: {
    color: "#9ca3af",
    fontWeight: "700",
  },
  smallText: {
    color: "#9ca3af",
    marginTop: 8,
  },
  preview: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderTopColor: "#111827",
    borderTopWidth: 1,
  },
  previewText: {
    color: "#e5e7eb",
    fontWeight: "700",
    fontSize: 16,
  },
  rowBtns: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  applyBtn: {
    backgroundColor: "#1f2937",
    marginRight: 8,
  },
  payBtn: {
    backgroundColor: "#06b6d4",
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  historyItem: {
    paddingVertical: 12,
    borderBottomColor: "#111827",
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  historyTitle: {
    color: "#e5e7eb",
    fontWeight: "600",
  },
  historyDate: {
    color: "#9ca3af",
    marginTop: 4,
    fontSize: 12,
  },
  historyTokens: {
    fontWeight: "700",
  },
  clearText: {
    color: "#ef4444",
    fontWeight: "700",
  },
  emptyText: {
    color: "#9ca3af",
    marginTop: 12,
    textAlign: "center",
  },
});
