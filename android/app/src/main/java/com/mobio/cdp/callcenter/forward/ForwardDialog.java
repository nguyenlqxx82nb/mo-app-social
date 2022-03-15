package com.mobio.cdp.callcenter.forward;

import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import android.app.DialogFragment;
import android.widget.AdapterView;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.ListView;
import android.widget.TextView;
import android.widget.Toast;

import com.androidnetworking.AndroidNetworking;
import com.androidnetworking.error.ANError;
import com.androidnetworking.interfaces.JSONObjectRequestListener;
import com.google.android.material.bottomsheet.BottomSheetDialogFragment;
import com.mobio.cdp.R;
import com.mobio.cdp.callcenter.common.Common;
import com.mobio.cdp.callcenter.common.Constants;
import com.mobio.cdp.callcenter.common.MyFetchListener;


import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;


public class ForwardDialog extends BottomSheetDialogFragment implements View.OnClickListener {

    private static Context context;
    private static String callId;
    private int selectedIndex;

    ListView listView;
    TextView tvEmpty;
    ForwardListViewAdapter forwardListViewAdapter;

    public static ForwardDialog newInstance(Context _context, String _callId) {
        context = _context;
        callId = _callId;

        return new ForwardDialog();
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View v = inflater.inflate(R.layout.forward_dialog, container, false);
        Typeface typefaceM = Typeface.createFromAsset(context.getApplicationContext().getAssets(), Constants.FONT_MEDIUM);
        TextView tvTitle = ((TextView) v.findViewById(R.id.tv_title));
        tvTitle.setTypeface(typefaceM);

        Button btnForward = (Button) v.findViewById(R.id.btn_forward);
        btnForward.setOnClickListener(this);
        btnForward.setTypeface(typefaceM);

        // Do all the stuff to initialize your custom view
        ImageButton btn_close = v.findViewById(R.id.btn_close);
        btn_close.setOnClickListener(this);

        listView = v.findViewById(R.id.list_view);
        tvEmpty = v.findViewById(R.id.tv_empty);
        this.getForwardGroups();
        return v;
    }

    @Override
    public void onResume() {
        super.onResume();
        getDialog().getWindow().setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
    }

    private void getForwardGroups() {
        SharedPreferences sharePreferences = context.getSharedPreferences(Constants.PREF_NAME, context.MODE_PRIVATE);
        String token = sharePreferences.getString(Constants.TOKEN, null);
        String hostPath = sharePreferences.getString(Constants.HOST_CALL_CENTER, null);
        String merchantId = sharePreferences.getString(Constants.MERCHANT_ID, null);

        Log.d(Constants.LOG_TAG, "getForwardGroups  hostPath = " + hostPath + " , merchantId = " + merchantId + " , token = " + token);
        if (hostPath == null || token == null || merchantId == null) {
            return;
        }
        AndroidNetworking.get(hostPath.trim() + "setting/queue")
            .addQueryParameter("lang", "vi")
            .addQueryParameter("transfer_call", "allow")
            .addHeaders("Accept", "application/json")
            .addHeaders("Content-Type", "application/json")
            .addHeaders("Authorization", "Bearer " + token)
            .addHeaders("X-Merchant-ID", merchantId)
            .build()
            .getAsJSONObject(new JSONObjectRequestListener() {
                @Override
                public void onResponse(JSONObject response) {
                    // do anything with response
                    Log.d(Constants.LOG_TAG, "onResponse OK " + response);
                    try {
                        if (response.getInt("code") == 200) {
                            JSONArray data = response.getJSONArray("data");
                            if (data != null && data.length() > 0) {
                                ArrayList<ForwardItem> list = new ArrayList<ForwardItem>();
                                for(int i=0; i< data.length(); i++) {
                                    JSONObject item = data.getJSONObject(i);
                                    list.add(new ForwardItem(item.getString("mobio_name"), item.getString("_id"), item.getString("third_party_id")));
                                }

                                forwardListViewAdapter = new ForwardListViewAdapter(list, context);
                                listView.setAdapter(forwardListViewAdapter);

                                listView.setOnItemClickListener(new AdapterView.OnItemClickListener() {
                                    @Override
                                    public void onItemClick(AdapterView<?> adapterView, View view, int i, long l) {
                                        ForwardItem item = (ForwardItem)forwardListViewAdapter.getItem(i);
                                        for (int j=0; j < forwardListViewAdapter.getCount(); j++) {
                                            ImageView _imgView = (ImageView) adapterView.getChildAt(j).findViewById(R.id.img_selected);
                                            _imgView.setVisibility(View.INVISIBLE);
                                        }
                                        ImageView imgView = (ImageView) view.findViewById(R.id.img_selected);
                                        imgView.setVisibility(View.VISIBLE);
                                        selectedIndex = i;
                                    }
                                });
                                selectedIndex = 0;
                            } else {
                                listView.setVisibility(View.GONE);
                                tvEmpty.setVisibility(View.VISIBLE);
                            }
                        }
                    } catch (Exception ex) {
                        ex.printStackTrace();
                    }
                }

                @Override
                public void onError(ANError error) {
                    // handle error
                    Log.d(Constants.LOG_TAG, "Error getForwardGroups Body = " + error.getErrorBody() + " detail = " + error.getErrorDetail() + " " + String.valueOf(error));
                    // fetchListener.onFetchError(null);
                }
            });
    }

    public void onClick(View v) {
        switch (v.getId()) {
            case R.id.btn_close:
                dismiss();
                break;
            case R.id.btn_forward:
                this.forwardCall();
                break;
            default:
                break;
        }
    }

    private void forwardCall(){
        if (this.selectedIndex < 0) {
            Toast.makeText(context, "Bạn vui lòng chọn nhóm trước khi chuyển tiếp!", Toast.LENGTH_LONG).show();
            return;
        }
        ForwardItem item = (ForwardItem)forwardListViewAdapter.getItem(this.selectedIndex);
        try {
            SharedPreferences sharePreferences = context.getSharedPreferences(Constants.PREF_NAME, context.MODE_PRIVATE);
            String token = sharePreferences.getString(Constants.TOKEN, null);
            String hostPath = sharePreferences.getString(Constants.HOST_CALL_CENTER, null);
            String merchantId = sharePreferences.getString(Constants.MERCHANT_ID, null);

            Log.d(Constants.LOG_TAG, "forwardCall  hostPath = " + hostPath + " , merchantId = " + merchantId + " , token = " + token);
            if (hostPath == null || token == null || merchantId == null) {
                return;
            }
            JSONObject data = new JSONObject();
            data.put("call_id", callId);
            data.put("to_number", item.thirdPartyId);
            data.put("to_type","queue");
            data.put("transfer_type","blind");

            AndroidNetworking.post(hostPath+"setting/call/transfer")
                .addQueryParameter("lang", "vi")
                .addJSONObjectBody(data)
                .addHeaders("Accept", "application/json")
                .addHeaders("Content-Type", "application/json")
                .addHeaders("Authorization", "Bearer " + token)
                .addHeaders("X-Merchant-ID", merchantId)
                .build()
                .getAsJSONObject(new JSONObjectRequestListener() {
                    @Override
                    public void onResponse(JSONObject response) {
                        dismiss();
                        // do anything with response
                        Log.d(Constants.LOG_TAG, "onResponse forwardCall= " + response +" call_id="+callId+"to_number="+item.thirdPartyId);
                        try {
                            if (response.getInt("code") == 200) {
                                Common.isForwardCall = true;
                                Toast.makeText(context, "Cuộc gọi đã được chuyển tiếp tới nhóm "+item.name, Toast.LENGTH_LONG).show();
                            } else {
                                Toast.makeText(context, "Có lỗi xẩy ra!", Toast.LENGTH_LONG).show();
                            }
                        } catch (Exception ex) {
                            ex.printStackTrace();
                        }
                    }

                    @Override
                    public void onError(ANError error) {
                        Toast.makeText(context, "Có lỗi xẩy ra!", Toast.LENGTH_LONG).show();
                        // handle error
                        Log.d(Constants.LOG_TAG, "Error forwardCall Body = " + error.getErrorBody() + " detail = " + error.getErrorDetail() + " " + String.valueOf(error));
                        dismiss();
                    }
                });
        } catch (Exception ex) {

        }

    }
}
