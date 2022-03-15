package com.mobio.cdp.callcenter.forward;

import android.content.Context;
import android.graphics.Typeface;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.ImageView;
import android.widget.TextView;

import com.mobio.cdp.R;
import com.mobio.cdp.callcenter.common.Constants;

import java.util.ArrayList;

public class ForwardListViewAdapter extends BaseAdapter {
    final ArrayList<ForwardItem> listForward;
    Context context;
    ForwardListViewAdapter(ArrayList<ForwardItem> listForward, Context context) {
        this.context = context;
        this.listForward = listForward;
    }

    @Override
    public int getCount() {
        return listForward.size();
    }

    @Override
    public Object getItem(int position) {
        return listForward.get(position);
    }

    @Override
    public long getItemId(int position) {
        return listForward.get(position)._id;
    }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        View view;
        if (convertView == null) {
            view = View.inflate(parent.getContext(), R.layout.forward_list_item, null);
        } else view = convertView;

        Typeface typefaceB = Typeface.createFromAsset(this.context.getApplicationContext().getAssets(), Constants.FONT_BOLD);
        Typeface typefaceM = Typeface.createFromAsset(this.context.getApplicationContext().getAssets(), Constants.FONT_MEDIUM);
        Typeface typefaceR = Typeface.createFromAsset(this.context.getApplicationContext().getAssets(), Constants.FONT_REGULAR);

        //Bind sữ liệu phần tử vào View
        ForwardItem item = (ForwardItem) getItem(position);
        TextView tvName = ((TextView) view.findViewById(R.id.tv_name));
        tvName.setText(String.format(item.name));
        tvName.setTypeface(typefaceR);

        if (position == 0) {
            ImageView imgView = (ImageView) view.findViewById(R.id.img_selected);
            imgView.setVisibility(View.VISIBLE);
        }

        return view;
    }


}
