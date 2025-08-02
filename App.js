import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppState, Platform, StyleSheet, Text, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';
TaskManager.defineTask(
  BACKGROUND_NOTIFICATION_TASK,
  ({ data, error, executionInfo }) => {
    console.log(
      `${Platform.OS} BACKGROUND-NOTIFICATION-TASK: App in ${AppState.currentState} state.`
    );

    if (error) {
      console.log(
        `${Platform.OS} BACKGROUND-NOTIFICATION-TASK: Error! ${JSON.stringify(
          error
        )}`
      );

      return;
    }

    if (AppState.currentState.match(/inactive|background/) === null) {
      console.log(
        `${Platform.OS} BACKGROUND-NOTIFICATION-TASK: App not in background state, skipping task.`
      );

      return;
    }

    console.log(
      `${
        Platform.OS
      } BACKGROUND-NOTIFICATION-TASK: Received a notification in the background! ${JSON.stringify(
        data,
        null,
        2
      )}`
    );
  }
);

Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK)
  .then(() => {
    console.log(
      `${Platform.OS} Notifications.registerTaskAsync success: ${BACKGROUND_NOTIFICATION_TASK}`
    );
  })
  .catch((reason) => {
    console.log(
      `${Platform.OS} Notifications registerTaskAsync failed: ${reason}`
    );
  });

export default function App() {
  useEffect(() => {
    registerForPushNotificationsAsync()
      .then((token) => console.log(`Token: ${token}`))
      .catch((error) => console.log(`Error: ${error}`));
  }, []);

  useEffect(() => {
    console.log(`${Platform.OS} Creating notificationListener`);
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log(
          `${
            Platform.OS
          } Notification received through notificationListener [NotificationReceivedListener] ${JSON.stringify(
            notification,
            null,
            2
          )}`
        );
      }
    );

    console.log(`${Platform.OS} Creating responseListener`);
    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(
          `${
            Platform.OS
          } Response received through responseListener [NotificationResponseReceivedListener] ${JSON.stringify(
            response,
            null,
            2
          )}`
        );
      });

    console.log(`${Platform.OS} added listeners`);

    return () => {
      console.log(`${Platform.OS} Removing notificationListener`);
      notificationListener.remove();

      console.log(`${Platform.OS} Removing responseListener`);
      responseListener.remove();
    };
  }, []);

  const lastNotificationResponse = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (
      lastNotificationResponse === undefined ||
      lastNotificationResponse === null
    ) {
      console.log(
        `${
          Platform.OS
        } lastNotificationResponse is undefined or null [useLastNotificationResponse] ${JSON.stringify(
          lastNotificationResponse,
          null,
          2
        )}`
      );

      return;
    }

    console.log(
      `${
        Platform.OS
      } Got notification from lastNotificationResponse [useLastNotificationResponse] ${JSON.stringify(
        lastNotificationResponse,
        null,
        2
      )}`
    );
  }, [lastNotificationResponse]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      console.log(`${Platform.OS} App state changed to ${nextAppState}`);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

function handleRegistrationError(errorMessage) {
  alert(errorMessage);
  throw new Error(errorMessage);
}

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C'
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      handleRegistrationError(
        'Permission not granted to get push token for push notification!'
      );
      return;
    }
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;
    if (!projectId) {
      handleRegistrationError('Project ID not found');
      return;
    }
    try {
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId
        })
      ).data;
      return pushTokenString;
    } catch (e) {
      handleRegistrationError(`${e}`);
    }
  } else {
    handleRegistrationError('Must use physical device for push notifications');
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  }
});
