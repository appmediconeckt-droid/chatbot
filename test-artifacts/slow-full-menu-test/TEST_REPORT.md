# Visible Live Testing Report

Date: 2026-07-04
Frontend: http://127.0.0.1:5173/
Backend: https://chatbot-backend-production-ea76.up.railway.app

## User Flow

Login: pass
Dashboard URL: http://127.0.0.1:5173/user-dashboard
Logout: pass

Tested menus:
- Chat: pass, screenshot `user-03-chat.png`
- Counselor: pass, screenshot `user-04-counselor.png`
- Appointments: pass, screenshot `user-05-appointments.png`
- Wallet: pass, screenshot `user-06-wallet.png`
- Call History: pass, screenshot `user-07-call-history.png`
- Help Support: pass, screenshot `user-08-help-support.png`
- Privacy: pass, screenshot `user-09-privacy.png`
- Settings: pass, screenshot `user-10-settings.png`
- My Profile: pass, screenshot `user-11-my-profile.png`

## Counselor Flow

Login: pass
Dashboard URL: http://127.0.0.1:5173/counselor-dashboard
Logout: pass

Tested menus:
- Messages: pass, screenshot `counsellor-03-messages.png`
- Appointments: pass, screenshot `counsellor-04-appointments.png`
- Sessions: pass, screenshot `counsellor-05-sessions.png`
- Call History: pass, screenshot `counsellor-06-call-history.png`
- Earnings: pass, screenshot `counsellor-07-earnings.png`
- Profile: pass, screenshot `counsellor-08-profile.png`
- Settings: pass, screenshot `counsellor-09-settings.png`

## Issues Found

- Live backend returns 404 for `/api/ai-chat/history`.
- Live backend returns 404 for `/api/chat/payment-config`.
- Google Sign-In iframe returns 403 in the test browser. Normal email/password login still works.
- Google Translate fetch warnings appear for some conversation text. Core dashboard flow still works.

## Root Cause Note

The local backend code already defines `/api/ai-chat/history` and `/api/chat/payment-config` in `chatbot-backend/src/app.js`.
Because Railway returns `Cannot GET`/404 for those same routes, the live Railway backend appears to be running an older or different deployment than the current local code.
