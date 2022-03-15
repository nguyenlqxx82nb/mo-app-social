package com.mobio.cdp.callcenter;

import android.content.Context;
import android.content.Intent;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.google.android.material.bottomsheet.BottomSheetDialogFragment;
import com.mobio.cdp.R;
import com.mobio.cdp.callcenter.common.Constants;

public class DigitDialogFragment extends BottomSheetDialogFragment implements View.OnClickListener {

    public static Context context;

    public static final String TAG = "DigitDialogFragment";

    private TextView tv_number;

    public static DigitDialogFragment newInstance(Context _context) {
        context = _context;
        return new DigitDialogFragment();
    }

    @Override
    public void onAttach(Context context) {
        super.onAttach(context);
        this.context = context;
    }

    @Override
    public void onDetach() {
        super.onDetach();

    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.digit_dialog, container, false);
        Typeface typefaceB = Typeface.createFromAsset(getActivity().getAssets(), Constants.FONT_BOLD);
        Typeface typefaceM = Typeface.createFromAsset(getActivity().getAssets(), Constants.FONT_MEDIUM);

        tv_number = view.findViewById(R.id.tv_number);
        tv_number.setTypeface(typefaceB);

        ImageButton btn_close = view.findViewById(R.id.btn_close);
        btn_close.setOnClickListener(this);

        Button btn_1 = view.findViewById(R.id.btn_1);
        btn_1.setTypeface(typefaceB);
        btn_1.setOnClickListener(this);

        Button btn_2 = view.findViewById(R.id.btn_2);
        btn_2.setTypeface(typefaceB);
        btn_2.setOnClickListener(this);

        Button btn_3 = view.findViewById(R.id.btn_3);
        btn_3.setTypeface(typefaceB);
        btn_3.setOnClickListener(this);

        Button btn_4 = view.findViewById(R.id.btn_4);
        btn_4.setTypeface(typefaceB);
        btn_4.setOnClickListener(this);

        Button btn_5 = view.findViewById(R.id.btn_5);
        btn_5.setTypeface(typefaceB);
        btn_5.setOnClickListener(this);

        Button btn_6 = view.findViewById(R.id.btn_6);
        btn_6.setTypeface(typefaceB);
        btn_6.setOnClickListener(this);

        Button btn_7 = view.findViewById(R.id.btn_7);
        btn_7.setTypeface(typefaceB);
        btn_7.setOnClickListener(this);

        Button btn_8 = view.findViewById(R.id.btn_8);
        btn_8.setTypeface(typefaceB);
        btn_8.setOnClickListener(this);

        Button btn_9 = view.findViewById(R.id.btn_9);
        btn_9.setTypeface(typefaceB);
        btn_9.setOnClickListener(this);

        Button btn_10 = view.findViewById(R.id.btn_10);
        btn_10.setTypeface(typefaceB);
        btn_10.setOnClickListener(this);

        Button btn_11 = view.findViewById(R.id.btn_11);
        btn_11.setTypeface(typefaceB);
        btn_11.setOnClickListener(this);

        Button btn_12 = view.findViewById(R.id.btn_12);
        btn_12.setTypeface(typefaceB);
        btn_12.setOnClickListener(this);

        return view;
    }

    @Override
    public void onActivityCreated(@Nullable Bundle savedInstanceState) {
        super.onActivityCreated(savedInstanceState);
    }

    @Override
    public void onClick(View v) {
        switch (v.getId()) {
            case R.id.btn_1:
                sendDigit("1");
                break;
            case R.id.btn_2:
                sendDigit("2");
                break;
            case R.id.btn_3:
                sendDigit("3");
                break;
            case R.id.btn_4:
                sendDigit("4");
                break;
            case R.id.btn_5:
                sendDigit("5");
                break;
            case R.id.btn_6:
                sendDigit("6");
                break;
            case R.id.btn_7:
                sendDigit("7");
                break;
            case R.id.btn_8:
                sendDigit("8");
                break;
            case R.id.btn_9:
                sendDigit("9");
                break;
            case R.id.btn_10:
                sendDigit("*");
                break;
            case R.id.btn_11:
                sendDigit("0");
                break;
            case R.id.btn_12:
                sendDigit("#");
            case R.id.btn_close:
                dismiss();
                break;
        }
    }

    private void sendDigit(String digit) {
        String currText = tv_number.getText().toString();
        tv_number.setText(currText+digit);
        Intent intent = new Intent(Constants.STRINGEE_BROADCAST_CALL_ACTION);
        intent.putExtra("KEY", digit);
        intent.putExtra("ACTION", "DTMF");
        getActivity().sendBroadcast(intent);
    }
}
