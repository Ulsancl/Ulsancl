package io.github.ulsancl.marketdesk;

import android.net.Uri;
import com.google.androidbrowserhelper.trusted.LauncherActivity;
import java.util.Arrays;

/** Only our own game and account controls may be opened through exported intents. */
public final class MarketDeskActivity extends LauncherActivity {
    @Override protected Uri getLaunchingUrl() {
        Uri fallback = Uri.parse(getString(R.string.launch_url));
        Uri requested = getIntent().getData();
        if (requested != null && "https".equals(requested.getScheme())
                && fallback.getHost().equals(requested.getHost())
                && requested.getPort() == -1 && requested.getUserInfo() == null
                && Arrays.asList("/", "/privacy", "/delete-account", "/support", "/classic")
                    .contains(requested.getPath())) return requested;
        return fallback;
    }
}
