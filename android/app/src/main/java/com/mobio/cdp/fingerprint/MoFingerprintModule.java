package com.mobio.cdp.fingerprint;

import android.os.Build;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;

import androidx.annotation.NonNull;
import androidx.biometric.BiometricPrompt;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt.PromptInfo;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;

import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.NoSuchProviderException;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.bridge.UiThreadUtil;

// for Samsung/MeiZu compat, Android v16-23
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter;
import com.wei.android.lib.fingerprintidentify.FingerprintIdentify;
import com.wei.android.lib.fingerprintidentify.base.BaseFingerprint.ExceptionListener;
import com.wei.android.lib.fingerprintidentify.base.BaseFingerprint.IdentifyListener;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.NoSuchPaddingException;
import javax.crypto.SecretKey;
import java.security.Key;

import android.util.Log;
import android.view.Gravity;
import android.widget.Toast;

@ReactModule(name="MoFingerprint")
public class MoFingerprintModule extends ReactContextBaseJavaModule implements LifecycleEventListener
{
    public static final int MAX_AVAILABLE_TIMES = Integer.MAX_VALUE;
    public static final String TYPE_BIOMETRICS = "Biometrics";
    public static final String TYPE_FINGERPRINT_LEGACY = "Fingerprint";

    private final ReactApplicationContext mReactContext;
    // private BiometricPrompt biometricPrompt;

    // for Samsung/MeiZu compat, Android v16-23
    private FingerprintIdentify mFingerprintIdentify;

    private BiometricPrompt.PromptInfo promptInfo;
    private BiometricPrompt biometricPrompt;
    private int limitNumberAttempt = 4;
    private int currNumberAttempt = 0;
    public MoFingerprintModule(ReactApplicationContext reactContext) {
        super(reactContext);
        mReactContext = reactContext;
    }

    @Override
    public String getName() {
        return "MoFingerprint";
    }

    @Override
    public void onHostResume() {
    }

    @Override
    public void onHostPause() {
    }

    @Override
    public void onHostDestroy() {
        this.release();
    }

    private int currentAndroidVersion() {
        return Build.VERSION.SDK_INT;
    }

    private boolean requiresLegacyAuthentication() {
        return currentAndroidVersion() < 23;
    }

    public class AuthCallback extends BiometricPrompt.AuthenticationCallback {
        private Promise promise;

        public AuthCallback(final Promise promise) {
            super();
            this.promise = promise;
        }

        @Override
        public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
            super.onAuthenticationError(errorCode, errString);
            Log.d("FINGER", "onAuthenticationError "+errString +" errorCode = "+errorCode);
            release();
            // this.promise.reject("CANCEL", TYPE_BIOMETRICS);
        }

        @Override
        public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
            super.onAuthenticationSucceeded(result);
            Log.d("FINGER", "onAuthenticationSucceeded ");
            release();
            this.promise.resolve(true);
        }

        @Override
        public void onAuthenticationFailed() {
            super.onAuthenticationFailed();
            Log.d("FINGER", "onAuthenticationFailed ");
            // biometricPrompt.cancelAuthentication();
            currNumberAttempt += 1;
            if (currNumberAttempt < limitNumberAttempt) {
                //showToast("Vân tay không chính xác");
            } else {
                // showToast("Xác thực quá số lần cho phép");
                this.promise.reject("FAILED", TYPE_BIOMETRICS);
                biometricPrompt.cancelAuthentication();
                release();
            }
        }
    }

    public BiometricPrompt getBiometricPrompt(final FragmentActivity fragmentActivity, final Promise promise) {
        // memoize so can be accessed to cancel
        if (biometricPrompt != null) {
            return biometricPrompt;
        }

        // listen for onHost* methods
        mReactContext.addLifecycleEventListener(this);

        AuthCallback authCallback = new AuthCallback(promise);
        Executor executor = Executors.newSingleThreadExecutor();
        biometricPrompt = new BiometricPrompt(
            fragmentActivity,
            executor,
            authCallback
        );

        return biometricPrompt;
    }

    private SecretKey createKey() throws NoSuchProviderException, NoSuchAlgorithmException, InvalidAlgorithmParameterException {
        String algorithm = KeyProperties.KEY_ALGORITHM_AES;
        String provider = "AndroidKeyStore";
        KeyGenerator keyGenerator = KeyGenerator.getInstance(algorithm, provider);
        KeyGenParameterSpec keyGenParameterSpec = new KeyGenParameterSpec.Builder("MY_KEY", KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_CBC)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_PKCS7)
                .setUserAuthenticationRequired(true)
                .build();

        keyGenerator.init(keyGenParameterSpec);
        return keyGenerator.generateKey();
    }

    private Cipher getEncryptCipher(Key key) throws NoSuchPaddingException, NoSuchAlgorithmException, InvalidKeyException {
        String algorithm = KeyProperties.KEY_ALGORITHM_AES;
        String blockMode = KeyProperties.BLOCK_MODE_CBC;
        String padding = KeyProperties.ENCRYPTION_PADDING_PKCS7;
        Cipher cipher = Cipher.getInstance(algorithm+"/"+blockMode+"/"+padding);
        cipher.init(Cipher.ENCRYPT_MODE, key);
        return cipher;
    }

    private void biometricAuthenticate(final String title, final String subtitle, final String description, final String cancelButton, final Promise promise) {
        try {
            UiThreadUtil.runOnUiThread(
                new Runnable() {
                    @Override
                    public void run() {
                        try {
                            FragmentActivity fragmentActivity = (FragmentActivity) mReactContext.getCurrentActivity();

                            if(fragmentActivity == null) return;

                            BiometricPrompt bioPrompt = getBiometricPrompt(fragmentActivity, promise);

                            PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                                    .setDeviceCredentialAllowed(false)
                                    .setConfirmationRequired(false)
                                    .setNegativeButtonText(cancelButton)
                                    .setDescription(description)
                                    .setSubtitle(subtitle)
                                    .setTitle(title)
                                    .build();
                            BiometricPrompt.CryptoObject cryptoObject = new BiometricPrompt.CryptoObject(getEncryptCipher(createKey()));
                            bioPrompt.authenticate(promptInfo);
                            Log.d("FINGER", "Show fingerprint");
                        } catch (Exception ex) {
                        }

                    }
                });
        } catch (Exception ex) {
        }
    }
    // the below constants are consistent across BiometricPrompt and BiometricManager
    private String biometricPromptErrName(int errCode) {
        switch (errCode) {
            case BiometricPrompt.ERROR_CANCELED:
                return "SystemCancel";
            case BiometricPrompt.ERROR_HW_NOT_PRESENT:
                return "FingerprintScannerNotSupported";
            case BiometricPrompt.ERROR_HW_UNAVAILABLE:
                return "FingerprintScannerNotAvailable";
            case BiometricPrompt.ERROR_LOCKOUT:
                return "DeviceLocked";
            case BiometricPrompt.ERROR_LOCKOUT_PERMANENT:
                return "DeviceLockedPermanent";
            case BiometricPrompt.ERROR_NEGATIVE_BUTTON:
                return "UserCancel";
            case BiometricPrompt.ERROR_NO_BIOMETRICS:
                return "FingerprintScannerNotEnrolled";
            case BiometricPrompt.ERROR_NO_DEVICE_CREDENTIAL:
                return "PasscodeNotSet";
            case BiometricPrompt.ERROR_NO_SPACE:
                return "DeviceOutOfMemory";
            case BiometricPrompt.ERROR_TIMEOUT:
                return "AuthenticationTimeout";
            case BiometricPrompt.ERROR_UNABLE_TO_PROCESS:
                return "AuthenticationProcessFailed";
            case BiometricPrompt.ERROR_USER_CANCELED:  // actually 'user elected another auth method'
                return "UserFallback";
            case BiometricPrompt.ERROR_VENDOR:
                // hardware-specific error codes
                return "HardwareError";
            default:
                return "FingerprintScannerUnknownError";
        }
    }

    private String getSensorError() {
        BiometricManager biometricManager = BiometricManager.from(mReactContext);
        int authResult = biometricManager.canAuthenticate();

        if (authResult == BiometricManager.BIOMETRIC_SUCCESS) {
            return null;
        }
        if (authResult == BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE) {
            return "FingerprintScannerNotSupported";
        } else if (authResult == BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED) {
            return "FingerprintScannerNotEnrolled";
        } else if (authResult == BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE) {
            return "FingerprintScannerNotAvailable";
        }
        return null;
    }

    @ReactMethod
    public void authenticate(String title, String subtitle, String description, String cancelButton, final Promise promise) {
        if (requiresLegacyAuthentication()) {
            legacyAuthenticate(promise);
        }
        else {
            final String errorName = getSensorError();
            if (errorName != null) {
                promise.reject(errorName, TYPE_BIOMETRICS);
                MoFingerprintModule.this.release();
                return;
            }

            biometricAuthenticate(title, subtitle, description, cancelButton, promise);
        }
    }

    @ReactMethod
    public void release() {
        if (requiresLegacyAuthentication()) {
            getFingerprintIdentify().cancelIdentify();
            mFingerprintIdentify = null;
        }

        // consistent across legacy and current API
        if (biometricPrompt != null) {
            biometricPrompt.cancelAuthentication();  // if release called from eg React
        }
        biometricPrompt = null;
        mReactContext.removeLifecycleEventListener(this);
    }

    @ReactMethod
    public void isSensorAvailable(final Promise promise) {
        if (requiresLegacyAuthentication()) {
            String errorMessage = legacyGetErrorMessage();
            if (errorMessage != null) {
                promise.reject(errorMessage, TYPE_FINGERPRINT_LEGACY);
            } else {
                promise.resolve(TYPE_FINGERPRINT_LEGACY);
            }
            return;
        }

        // current API
        String errorName = getSensorError();
        if (errorName != null) {
            promise.reject(errorName, TYPE_BIOMETRICS);
        } else {
            promise.resolve(TYPE_BIOMETRICS);
        }
    }


    // for Samsung/MeiZu compat, Android v16-23
    private FingerprintIdentify getFingerprintIdentify() {
        if (mFingerprintIdentify != null) {
            return mFingerprintIdentify;
        }
        mReactContext.addLifecycleEventListener(this);
        mFingerprintIdentify = new FingerprintIdentify(mReactContext);
        mFingerprintIdentify.setSupportAndroidL(true);
        mFingerprintIdentify.setExceptionListener(
            new ExceptionListener() {
                @Override
                public void onCatchException(Throwable exception) {
                    mReactContext.removeLifecycleEventListener(MoFingerprintModule.this);
                }
            }
        );
        mFingerprintIdentify.init();
        return mFingerprintIdentify;
    }

    private String legacyGetErrorMessage() {
        if (!getFingerprintIdentify().isHardwareEnable()) {
            return "FingerprintScannerNotSupported";
        } else if (!getFingerprintIdentify().isRegisteredFingerprint()) {
            return "FingerprintScannerNotEnrolled";
        } else if (!getFingerprintIdentify().isFingerprintEnable()) {
            return "FingerprintScannerNotAvailable";
        }

        return null;
    }


    private void legacyAuthenticate(final Promise promise) {
        final String errorMessage = legacyGetErrorMessage();
        if (errorMessage != null) {
            promise.reject(errorMessage, TYPE_FINGERPRINT_LEGACY);
            MoFingerprintModule.this.release();
            return;
        }

        getFingerprintIdentify().resumeIdentify();
        getFingerprintIdentify().startIdentify(MAX_AVAILABLE_TIMES, new IdentifyListener() {
            @Override
            public void onSucceed() {
                promise.resolve(true);
            }

            @Override
            public void onNotMatch(int availableTimes) {
                if (availableTimes <= 0) {
                    mReactContext.getJSModule(RCTDeviceEventEmitter.class)
                            .emit("FINGERPRINT_SCANNER_AUTHENTICATION", "DeviceLocked");

                } else {
                    mReactContext.getJSModule(RCTDeviceEventEmitter.class)
                            .emit("FINGERPRINT_SCANNER_AUTHENTICATION", "AuthenticationNotMatch");
                }
            }

            @Override
            public void onFailed(boolean isDeviceLocked) {
                if(isDeviceLocked){
                    promise.reject("AuthenticationFailed", "DeviceLocked");
                } else {
                    promise.reject("AuthenticationFailed", TYPE_FINGERPRINT_LEGACY);
                }
                MoFingerprintModule.this.release();
            }

            @Override
            public void onStartFailedByDeviceLocked() {
                // the first start failed because the device was locked temporarily
                promise.reject("AuthenticationFailed", "DeviceLocked");
            }
        });
    }

    private void showToast(String message) {
        UiThreadUtil.runOnUiThread(
            new Runnable() {
                @Override
                public void run() {
                    try {
                        Toast toast = Toast.makeText(mReactContext, message, Toast.LENGTH_LONG);
                        toast.setGravity(Gravity.CENTER, 0, 0);
                        toast.show();
                    } catch (Exception ex) {
                    }
                }
            });
    }
}
