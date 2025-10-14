import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PREF_FAVS_KEY = "pref.favorites"; // [{id,label,name,lat,lng}]

export default function FavoritesScreen() {
  const [items, setItems] = useState([]);
  const [label, setLabel] = useState("");
  const [name, setName] = useState("");

  useEffect(()=>{ (async()=>{
    const s = await AsyncStorage.getItem(PREF_FAVS_KEY);
    if (s) setItems(JSON.parse(s));
  })(); }, []);

  async function save(list){
    setItems(list);
    await AsyncStorage.setItem(PREF_FAVS_KEY, JSON.stringify(list));
  }

  function addFav(){
    if (!label || !name) return Alert.alert("Add favorite","Please enter a label and place name.");
    const next = [{ id: Date.now(), label, name }, ...items];
    save(next); setLabel(""); setName("");
  }

  function removeFav(id){
    save(items.filter(i=>i.id!==id));
  }

  return (
    <View style={{ flex:1, padding:16, backgroundColor:"#fff" }}>
      <Text style={{ fontSize:18, fontWeight:"800", marginBottom:8 }}>Favorite locations</Text>

      <View style={s.row}>
        <TextInput style={s.input} placeholder="Label (Home, Work…)" value={label} onChangeText={setLabel}/>
        <TextInput style={[s.input,{flex:1}]} placeholder="Place name or address" value={name} onChangeText={setName}/>
        <TouchableOpacity style={s.addBtn} onPress={addFav}><Text style={{color:"#fff",fontWeight:"700"}}>Add</Text></TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={i=>String(i.id)}
        renderItem={({item})=>(
          <View style={s.item}>
            <View style={{flex:1}}>
              <Text style={{fontWeight:"700"}}>{item.label}</Text>
              <Text style={{color:"#6b7280"}}>{item.name}</Text>
            </View>
            <TouchableOpacity onPress={()=>removeFav(item.id)}><Text style={{color:"#ef4444",fontWeight:"700"}}>Remove</Text></TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={{color:"#6b7280"}}>No favorites yet.</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  row:{ flexDirection:"row", gap:8, marginBottom:12 },
  input:{ borderWidth:1, borderColor:"#e5e7eb", borderRadius:10, padding:10, minWidth:110, backgroundColor:"#fff" },
  addBtn:{ backgroundColor:"#2F80ED", paddingHorizontal:14, borderRadius:10, justifyContent:"center" }
});
