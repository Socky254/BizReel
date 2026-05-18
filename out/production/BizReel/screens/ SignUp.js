# Supabase Setup for Your App (Expo / React Native)

This setup adds:

* environment variables
* Supabase client helper
* authentication session persistence
* automatic session refresh
* middleware-style auth protection pattern

---

# 1. Install Dependencies

Run inside your project folder:

```bash
npm install @supabase/supabase-js
npx expo install react-native-url-polyfill
npm install @react-native-async-storage/async-storage
```

---

# 2. Create Environment Variables

Create a file:

```text
.env
```

Add:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Get these from:

Supabase Dashboard ? Settings ? API

---

# 3. Create Supabase Client Helper

Create:

```text
lib/supabase.js
```

Add:

```javascript
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
```

This enables:

* persistent login
* token refresh
* saved sessions
* automatic authentication restoration

---

# 4. Restart Expo

After creating .env:

```bash
npx expo start --clear
```

---

# 5. Create Authentication Context

Create:

```text
context/AuthContext.js
```

Add:

```javascript
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

---

# 6. Wrap Your App

Inside:

```text
App.js
```

Add:

```javascript
import { AuthProvider } from './context/AuthContext'

export default function App() {
  return (
    <AuthProvider>
      {/* Your Navigation */}
    </AuthProvider>
  )
}
```

---

# 7. Create Protected Route Logic

Example:

```javascript
import { useAuth } from './context/AuthContext'
import LoginScreen from './screens/LoginScreen'
import HomeScreen from './screens/HomeScreen'

export default function RootNavigation() {
  const { session, loading } = useAuth()

  if (loading) return null

  return session ? <HomeScreen /> : <LoginScreen />
}
```

This behaves like middleware:

* logged in users ? app
* logged out users ? login screen

---

# 8. Signup Example

```javascript
const signUp = async () => {
  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    alert(error.message)
  } else {
    alert('Account created')
  }
}
```

---

# 9. Login Example

```javascript
const signIn = async () => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    alert(error.message)
  }
}
```

---

# 10. Logout Example

```javascript
const logout = async () => {
  await supabase.auth.signOut()
}
```

---

# 11. Test Session Persistence

Test this:

1. Login
2. Close app completely
3. Reopen app

If setup is correct:

* user stays logged in
* session restores automatically

---

# 12. Recommended Folder Structure

```text
project-root/
¦
+-- App.js
+-- .env
¦
+-- lib/
¦   +-- supabase.js
¦
+-- context/
¦   +-- AuthContext.js
¦
+-- navigation/
¦   +-- RootNavigation.js
¦
+-- screens/
¦   +-- LoginScreen.js
¦   +-- SignupScreen.js
¦   +-- HomeScreen.js
¦   +-- ProfileScreen.js
¦
+-- components/
```

---

# 13. Create Login Screen

Create:

```text
screens/LoginScreen.js
```

Add:

```javascript
import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'

import { supabase } from '../lib/supabase'

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={signIn}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
        <Text>Create Account</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 12,
    borderRadius: 10,
  },
  button: {
    backgroundColor: 'black',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
})
```

---

# 14. Create Signup Screen

Create:

```text
screens/SignupScreen.js
```

Add:

```javascript
import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'

import { supabase } from '../lib/supabase'

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const signUp = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      alert(error.message)
    } else {
      alert('Account created successfully')
      navigation.navigate('Login')
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={signUp}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 12,
    borderRadius: 10,
  },
  button: {
    backgroundColor: 'black',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
})
```

---

# 15. Create Home Screen

Create:

```text
screens/HomeScreen.js
```

Add:

```javascript
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { supabase } from '../lib/supabase'

export default function HomeScreen() {
  const logout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BizReel Home</Text>

      <TouchableOpacity style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: 'black',
    padding: 14,
    borderRadius: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
})
```

---

# 16. Create Root Navigation

Install navigation:

```bash
npm install @react-navigation/native
npm install react-native-screens react-native-safe-area-context
npm install @react-navigation/native-stack
```

Create:

```text
navigation/RootNavigation.js
```

Add:

```javascript
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import LoginScreen from '../screens/LoginScreen'
import SignupScreen from '../screens/SignupScreen'
import HomeScreen from '../screens/HomeScreen'

import { useAuth } from '../context/AuthContext'

const Stack = createNativeStackNavigator()

export default function RootNavigation() {
  const { session, loading } = useAuth()

  if (loading) return null

  return (
    <NavigationContainer>
      {session ? (
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  )
}
```

---

# 17. Update App.js

Replace your App.js with:

```javascript
import { AuthProvider } from './context/AuthContext'
import RootNavigation from './navigation/RootNavigation'

export default function App() {
  return (
    <AuthProvider>
      <RootNavigation />
    </AuthProvider>
  )
}
```

---

# 18. What You Now Have

After this setup your app supports:

* real accounts
* secure authentication
* persistent login
* automatic token refresh
* protected screens
* login/signup flow
* navigation authentication logic
* production-ready auth flow

This becomes the foundation for:

* uploads
* comments
* likes
* messaging
* seller profiles
* realtime feeds
* notifications
* subscriptions

After this setup your app supports:

* real accounts
* secure authentication
* persistent login
* automatic token refresh
* protected screens
* production-ready auth flow

This becomes the foundation for:

* uploads
* comments
* likes
* messaging
* seller profiles
* realtime feeds
* notifications
* subscriptions
