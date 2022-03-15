package com.mobio.cdp;

import android.app.KeyguardManager;
import android.content.Intent;
import android.os.Bundle;
import android.os.PowerManager;
import android.util.Log;
import android.view.WindowManager;

import androidx.lifecycle.Lifecycle;
import androidx.lifecycle.LifecycleObserver;
import androidx.lifecycle.OnLifecycleEvent;
import androidx.lifecycle.ProcessLifecycleOwner;

import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;
import com.mobio.cdp.notification.common.Constant;
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView;

import com.facebook.react.ReactActivity;
import org.devio.rn.splashscreen.SplashScreen;

import com.mobio.cdp.common.MainCommon;
import com.mobio.cdp.notification.PushNotificationModule;

public class MainActivity extends ReactActivity implements LifecycleObserver {
  private PowerManager powerManager;
  private PowerManager.WakeLock wakeLock;
  private KeyguardManager.KeyguardLock lock;
  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "Mobio_App";
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    // getWindow().clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
    ProcessLifecycleOwner.get().getLifecycle().addObserver(this);
    Intent intent = getIntent();
    if (intent != null) {
      String action = intent.getStringExtra("action");
      Log.d(Constant.LOG_TAG, "action ="+ action);
      if (action != null && action.equalsIgnoreCase("NEW_SOCIAL_MESSAGE")) {
        String data = intent.getStringExtra("data");
        MainCommon.messageSocialData = data;
      }
    }
    SplashScreen.show(this);
    //super.onCreate(savedInstanceState);
    super.onCreate(null);
  }

  @Override
  public void onNewIntent(final Intent intent) {
    super.onNewIntent(intent);
    setIntent(intent);

    if (intent != null) {
      String action = intent.getStringExtra("action");
      Log.d(Constant.LOG_TAG, "action ="+ action);
      if (action != null && action.equalsIgnoreCase("NEW_SOCIAL_MESSAGE")) {
        String data = intent.getStringExtra("data");
        Log.d(Constant.LOG_TAG, "data "+ data);
        PushNotificationModule.sendSocialEvent(data);
      }
    }
  }

  @OnLifecycleEvent(Lifecycle.Event.ON_STOP)
  public void onAppBackgrounded() {
    Log.d("AppLifecycle", "App in background");
    MainCommon.isAppInActive = false;
  }

  @OnLifecycleEvent(Lifecycle.Event.ON_START)
  public void onAppForegrounded() {
    Log.d("AppLifecycle", "App in foreground");
    MainCommon.isAppInBackground = false;
    MainCommon.isAppInActive = true;
  }

  @OnLifecycleEvent(Lifecycle.Event.ON_RESUME)
  public void onAppActive()
  {
    Log.d("AppLifecycle", "App in active");
    MainCommon.isAppInActive = true;
  }

  @OnLifecycleEvent(Lifecycle.Event.ON_PAUSE)
  public void onAppPause()
  {
    Log.d("AppLifecycle", "App in foreground");
    MainCommon.isAppInActive = false;
    MainCommon.isAppInBackground = false;
  }

  @Override
  public void onDestroy() {
    Log.d("AppLifecycle", "App in onAppDestroy");
    MainCommon.isAppInBackground = true;
    super.onDestroy();
  }

  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new ReactActivityDelegate(this, getMainComponentName()) {
       @Override
       protected ReactRootView createRootView() {
         return new RNGestureHandlerEnabledRootView(MainActivity.this);
       }
    };
  }

}
