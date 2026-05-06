import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { apiClient } from '@/services/api';
import { ChatMessage } from '@/app/types';

export default function ChatScreen() {
  const [chatLocation, setChatLocation] = useState<{ city?: string; address?: string }>({});
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: 'Hi! I\'m your RoadGuard AI assistant. Ask me about traffic, road conditions, incidents, or safety tips!',
      isUser: false,
      timestamp: Date.now(),
      suggestions: ['Traffic near me', 'Latest incidents', 'Safety tips', 'Emergency contacts'],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const syncChatLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      const geocode = await Location.reverseGeocodeAsync({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });

      const geo = geocode[0];
      const city = geo?.city || geo?.subregion || geo?.region;

      const addressParts = [
        geo?.name,
        geo?.streetNumber,
        geo?.street,
        geo?.district,
        geo?.city,
        geo?.subregion,
        geo?.region,
        geo?.postalCode,
        geo?.country,
      ].filter(Boolean);

      const address = addressParts.length
        ? Array.from(new Set(addressParts.map((part) => String(part).trim()))).join(', ')
        : undefined;

      setChatLocation({
        city: city ? String(city) : undefined,
        address,
      });
    } catch {
      setChatLocation({});
    }
  };

  useEffect(() => {
    syncChatLocation();
  }, []);

  const sendMessage = async (text: string = inputText) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: String(Date.now()),
      text: text.trim(),
      isUser: true,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      // Call backend chat endpoint
      const response = await apiClient.chat(text.trim(), chatLocation);

      const assistantMessage: ChatMessage = {
        id: String(Date.now() + 1),
        text: response.message,
        isUser: false,
        timestamp: Date.now(),
        suggestions: response.data?.suggestions,
        data: response.data,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: String(Date.now() + 1),
        text: `Sorry, I encountered an error: ${err.message}. Please try again.`,
        isUser: false,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const MessageBubble = ({ message }: { message: ChatMessage }) => (
    <View
      style={[
        styles.messageBubble,
        message.isUser ? styles.userBubble : styles.assistantBubble,
      ]}
    >
      <Text style={[styles.messageText, message.isUser && styles.userText]}>
        {message.text}
      </Text>

      {message.suggestions && message.suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {message.suggestions.map((suggestion, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.suggestionChip}
              onPress={() => sendMessage(suggestion)}
              disabled={loading}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RoadGuard AI Assistant</Text>
        <Text style={styles.headerSubtitle}>Ask anything about traffic & safety</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={styles.messagesList}
        scrollEnabled={true}
      />

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#0a7ea4" />
          <Text style={styles.loadingText}>AI is thinking...</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask me something..."
          placeholderTextColor="#999"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.sendButton, (loading || !inputText.trim()) && styles.sendButtonDisabled]}
          onPress={() => sendMessage()}
          disabled={loading || !inputText.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  messagesList: {
    flexGrow: 1,
    padding: 16,
    justifyContent: 'flex-end',
  },
  messageBubble: {
    marginVertical: 6,
    maxWidth: '85%',
    borderRadius: 12,
    padding: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#0a7ea4',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  userText: {
    color: '#fff',
  },
  suggestionsContainer: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suggestionChip: {
    backgroundColor: '#e8f4f8',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  suggestionText: {
    fontSize: 12,
    color: '#0a7ea4',
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
