import os
import sys
import json
from pathlib import Path
from datetime import datetime, timezone
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.ml.feature_extraction import extract_url_features, FEATURE_COLUMNS

MODEL_DIR = Path(__file__).resolve().parent / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

# Documented Training Dataset: Representative Legitimate and Phishing URLs
URL_DATASET = [
    # Legitimate (Label 0)
    ("https://www.google.com", 0),
    ("https://www.github.com/explore", 0),
    ("https://en.wikipedia.org/wiki/Computer_security", 0),
    ("https://www.microsoft.com/en-us/software-download", 0),
    ("https://stackoverflow.com/questions/tagged/python", 0),
    ("https://www.amazon.com/gp/bestsellers", 0),
    ("https://www.apple.com/iphone", 0),
    ("https://docs.python.org/3/library/urllib.parse.html", 0),
    ("https://www.coursera.org/learn/cyber-security", 0),
    ("https://developer.mozilla.org/en-US/docs/Web/HTTP", 0),
    ("https://www.netflix.com/browse", 0),
    ("https://www.youtube.com/watch?v=dQw4w9WgXcQ", 0),
    ("https://www.linkedin.com/feed", 0),
    ("https://www.kaggle.com/datasets", 0),
    ("https://www.harvard.edu/academics", 0),
    ("https://www.mit.edu/research", 0),
    ("https://www.reddit.com/r/cybersecurity", 0),
    ("https://news.ycombinator.com", 0),
    ("https://medium.com/@infosec/modern-security-practices", 0),
    ("https://www.bbc.com/news/technology", 0),
    ("https://www.reuters.com/technology", 0),
    ("https://www.nytimes.com", 0),
    ("https://store.steampowered.com", 0),
    ("https://open.spotify.com/playlist", 0),
    ("https://www.nationalgeographic.com", 0),
    ("https://hub.docker.com/_/python", 0),
    ("https://pypi.org/project/scikit-learn", 0),
    ("https://gitlab.com/gitlab-org/gitlab", 0),
    ("https://bitbucket.org/product", 0),
    ("https://www.cloudflare.com/learning/access-management", 0),
    ("https://www.paypal.com/signin", 0),
    ("https://www.chase.com/personal/banking", 0),
    ("https://www.bankofamerica.com", 0),
    ("https://www.wellsfargo.com", 0),
    ("https://onlinesbi.sbi", 0),
    ("https://netbanking.hdfcbank.com", 0),
    ("https://www.icicibank.com", 0),
    ("https://paytm.com", 0),
    ("https://www.adobe.com/products/photoshop.html", 0),
    ("https://workspace.google.com", 0),
    ("https://www.dropbox.com/plans", 0),
    ("https://slack.com/pricing", 0),
    ("https://zoom.us/join", 0),
    ("https://www.figma.com", 0),
    ("https://aws.amazon.com/console", 0),
    ("https://azure.microsoft.com/en-us", 0),
    ("https://cloud.google.com", 0),
    ("https://www.digitalocean.com/products", 0),
    ("https://arxiv.org/abs/2301.00000", 0),
    ("https://nature.com/articles", 0),
    
    # Phishing / Malicious (Label 1)
    ("http://192.168.1.100/admin/login.php", 1),
    ("http://185.220.101.4/secure/paypal/account-update.html", 1),
    ("http://103.251.167.22/sbi-netbanking-verify.html", 1),
    ("http://paypal-security-verification-alert.xyz/auth/login", 1),
    ("https://paypal.com.account-update-billing.top/signin", 1),
    ("http://bankofamerica-urgent-identity-verification.tk/login", 1),
    ("https://chase-secure-online-login.gq/auth/verify?session=93821", 1),
    ("http://wellsfargo-suspension-unlock.cf/verify-card", 1),
    ("https://sbi-kyc-mandatory-update.buzz/pan-card-link", 1),
    ("http://hdfc-bank-rewards-claim2026.icu/redeem.php", 1),
    ("https://icici-card-block-resolution.ml/unblock", 1),
    ("http://paytm-cashback-scratchcard-5000.top/claim", 1),
    ("https://netflix-subscription-renewal-urgent.xyz/billing", 1),
    ("http://google-security-alert-account-recovery.men/verify", 1),
    ("https://appleid-apple-support-unlock-service.racing/login", 1),
    ("http://amazon-prime-giftcard-giveaway.win/winner.html", 1),
    ("http://login:password@evil-phishing-host.xyz/auth", 1),
    ("http://secure.account.update.verify.auth.chase.phish-domain.club/id", 1),
    ("http://80.94.95.10:8080/webscr/login.php", 1),
    ("https://bit.ly/3xFakeSuspiciousScamLink123", 1),
    ("http://free-crypto-doubler-giveaway.buzz/metamask-connect", 1),
    ("https://binance-kyc-security-reactivation.top/wallet", 1),
    ("http://coinbase-fraud-protection-unit.icu/resolve", 1),
    ("https://metamask-seed-phrase-backup-restore.cf/sync", 1),
    ("http://fedex-package-customs-duty-unpaid.xyz/tracking/pay", 1),
    ("https://dhl-express-reschedule-delivery-fee.ml/confirm", 1),
    ("http://indiatimes-lottery-winner-kbc-crorepati.gq/prize", 1),
    ("https://income-tax-refund-pending-transfer.buzz/refund-form", 1),
    ("http://electricity-bill-unpaid-power-cut-tonight.top/pay-now", 1),
    ("https://sim-card-deactivation-warning-telecom.xyz/kyc", 1),
    ("http://facebook-security-violation-account-removal.icu/appeal", 1),
    ("https://instagram-copyright-infringement-strike.club/form", 1),
    ("http://whatsapp-gold-edition-premium-download.tk/install.apk", 1),
    ("https://secure-login.bank.com.fakeportal-update.work/auth", 1),
    ("http://45.33.32.156/wp-content/plugins/paypal/webscr.php", 1),
    ("https://microsoft-office365-urgent-password-reset.date/mail", 1),
    ("http://dropbox-shared-confidential-invoice.men/view.html", 1),
    ("https://adobe-acrobat-document-sign-in.win/access", 1),
    ("http://zoom-meeting-security-patch-urgent.buzz/download", 1),
    ("https://telegram-airdrop-bonus-token.xyz/connect-wallet", 1),
    ("http://steam-community-free-skins-trade.top/login", 1),
    ("https://spotify-family-billing-suspended.icu/update-card", 1),
    ("http://uber-ride-refund-claim-voucher.ml/redeem", 1),
    ("https://swiggy-zomato-free-food-coupons.gq/claim", 1),
    ("http://gov-covid-relief-fund-grant.cf/apply", 1),
    ("https://e-challan-traffic-police-fine-immediate-pay.xyz/challan", 1),
    ("http://epfo-provident-fund-claim-verification.buzz/claim", 1),
    ("https://aadhaar-card-biometric-lock-disabled.top/verify", 1),
    ("http://passport-urgent-appointment-booking-fee.icu/pay", 1),
    ("https://visa-mastercard-zero-liability-refund.work/card-details", 1),
]

# Documented Training Dataset: Representative Legitimate and Scam Messages
MESSAGE_DATASET = [
    # Legitimate (Label 0)
    ("Your package from Amazon has been delivered. Track your orders in the Amazon app.", 0),
    ("Hi Mom, I will reach home by 7 PM today. Please keep dinner ready.", 0),
    ("Your appointment with Dr. Sharma is confirmed for tomorrow at 10:30 AM at Apollo Clinic.", 0),
    ("Dear customer, your electricity bill of Rs 1,450 for Sep 2026 has been generated. Due date is Oct 25.", 0),
    ("Meeting reminder: CyberShield Project Standup starts in 15 minutes on Google Meet.", 0),
    ("Your Swiggy order from Biryani House is out for delivery. Delivery partner is Rahul.", 0),
    ("SBI: Rs 500.00 debited from a/c **1234 on 14-Oct-26 at ATM. Avl Bal: Rs 42,310.00.", 0),
    ("Uber: Your driver Deepak is arriving in a White Swift Dzire (DL 1Y A 4321).", 0),
    ("Welcome to GitHub! Please verify your email address to complete your registration.", 0),
    ("Your flight AI-805 from New Delhi to Mumbai is on schedule. Boarding gate 4B.", 0),
    ("Hey Priya, could you please review the hackathon presentation slides when free?", 0),
    ("HDFC Bank Alert: Monthly statement for your Credit Card ending 8812 is now ready to view.", 0),
    ("Your OTP for logging in to Netflix is 492018. It is valid for 5 minutes. Do not share it.", 0),
    ("Google: New sign-in detected on Windows PC. If this was you, no action is needed.", 0),
    ("Team, tomorrow's college symposium schedule has been updated on the official notice board.", 0),
    ("Reminder: Library book 'Computer Networks by Tanenbaum' is due for return on Friday.", 0),
    ("Your recharge of Rs 299 for Airtel mobile is successful. Validity: 28 days.", 0),
    ("Thanks for dining at Barbeque Nation! Rate your experience here: https://rate.bbq.com", 0),
    ("College notice: Semester examination forms must be submitted by Oct 30 at the Dean office.", 0),
    ("Hi Alex, thanks for sending the pull request. I left a few comments on line 42.", 0),

    # Scam / Phishing (Label 1)
    ("URGENT: Your SBI Bank account is suspended today! Share your OTP 48291 to verify and unblock immediately.", 1),
    ("Congratulations! You have won Rs 25,00,000 cash in KBC Jio Lucky Draw! Call manager Ramesh at 9876543210 to claim.", 1),
    ("Dear Customer, Your electricity connection will be disconnected tonight at 9:30 PM due to unpaid bill. Immediately pay on this link.", 1),
    ("Your SIM card will be deactivated in 24 hours due to pending KYC. Click http://sim-kyc-telecom.top to upload Aadhaar & Pan.", 1),
    ("HDFC Alert: Your NetBanking account is locked. To restore access, submit your Customer ID and Password at: http://hdfc-unlock.xyz", 1),
    ("FINAL NOTICE: Customs duty of Rs 2,499 pending for FedEx parcel #IN88219. Pay immediately via UPI or package will be seized.", 1),
    ("Income Tax Refund of Rs 34,500 has been approved. Please verify your bank account and debit card PIN to receive deposit now.", 1),
    ("Security Alert: Someone has unauthorized access to your WhatsApp. Send us the 6-digit verification code you just received to secure it.", 1),
    ("Earn Rs 5,000 daily working from home! Like YouTube videos and get instant UPI payment. Telegram @quick_crorepati to start.", 1),
    ("Your Netflix membership is on hold because your payment was declined. Update your credit card details immediately: http://netflix-pay.buzz", 1),
    ("Paytm KYC Expired! Your wallet balance Rs 15,400 will be forfeited. Click to complete instant biometric verification.", 1),
    ("Urgent message from Police Cyber Crime cell: A legal complaint has been filed against you. Pay settlement fine Rs 10,000 to avoid arrest.", 1),
    ("Amazon Gift Card worth $500 waiting for you! Click here and fill out personal survey with bank details to claim reward.", 1),
    ("Binance Security: Withdrawals suspended on your account. Send your 12-word seed phrase to customer service to verify ownership.", 1),
    ("Urgent: Mom is in hospital and needs immediate surgery! Please transfer Rs 20,000 immediately to UPI address urgenthelp@upi.", 1),
    ("Your credit card limit has been increased to 5 Lakhs! Provide CVV and OTP on this link to activate your new limit.", 1),
    ("Traffic Police E-Challan: You have an unpaid fine of Rs 2,000 for overspeeding. Pay within 2 hours or license will be cancelled.", 1),
    ("WhatsApp Gold is now available! Get secret hidden features, video call recording and animated stickers by clicking this link.", 1),
    ("Dear User, Your Apple ID has been locked for security reasons. Confirm your identity by entering password and payment method.", 1),
    ("Crypto Doubler Event: Elon Musk is giving away 1000 BTC! Send 0.1 BTC to this wallet and receive 0.2 BTC back immediately.", 1),
]

def train_url_model():
    print("=" * 60)
    print("TRAINING URL CLASSIFICATION MODEL")
    print("=" * 60)

    X_features = []
    y_labels = []

    for url, label in URL_DATASET:
        feat_dict = extract_url_features(url)["features"]
        vector = [feat_dict[col] for col in FEATURE_COLUMNS]
        X_features.append(vector)
        y_labels.append(label)

    X = np.array(X_features)
    y = np.array(y_labels)

    # Train / Test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=6,
        random_state=42,
        class_weight="balanced"
    )
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    y_prob = clf.predict_proba(X_test)[:, 1]

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    cm = confusion_matrix(y_test, y_pred).tolist()

    print(f"Dataset Size: {len(y)} samples ({sum(y == 0)} legitimate, {sum(y == 1)} phishing)")
    print(f"Test Set Accuracy:  {acc * 100:.2f}%")
    print(f"Test Set Precision: {prec * 100:.2f}%")
    print(f"Test Set Recall:    {rec * 100:.2f}%")
    print(f"Test Set F1-Score:  {f1 * 100:.2f}%")
    print(f"Confusion Matrix (TN, FP, FN, TP):\n{np.array(cm)}")

    # Feature importances
    importances = clf.feature_importances_
    feat_importance_dict = {
        name: round(float(imp), 4)
        for name, imp in sorted(zip(FEATURE_COLUMNS, importances), key=lambda x: x[1], reverse=True)
    }
    print("\nTop 5 Most Informative Features:")
    for k, v in list(feat_importance_dict.items())[:5]:
        print(f" - {k}: {v}")

    # Save artifact
    model_payload = {
        "model": clf,
        "feature_columns": FEATURE_COLUMNS,
        "feature_importances": feat_importance_dict,
        "version": "1.0.0-rf",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "metrics": {
            "accuracy": acc,
            "precision": prec,
            "recall": rec,
            "f1_score": f1,
            "confusion_matrix": cm,
            "dataset_size": len(y)
        }
    }
    joblib.dump(model_payload, MODEL_DIR / "url_classifier.joblib")
    print(f"Saved URL Classifier model to {MODEL_DIR / 'url_classifier.joblib'}")
    return model_payload

def train_message_model():
    print("\n" + "=" * 60)
    print("TRAINING SCAM MESSAGE / SOCIAL ENGINEERING NLP MODEL")
    print("=" * 60)

    texts = [msg for msg, label in MESSAGE_DATASET]
    labels = [label for msg, label in MESSAGE_DATASET]

    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.25, random_state=42, stratify=labels
    )

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1, lowercase=True)),
        ("clf", LogisticRegression(C=1.0, random_state=42, class_weight="balanced"))
    ])
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)[:, 1]

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    cm = confusion_matrix(y_test, y_pred).tolist()

    print(f"Dataset Size: {len(labels)} samples ({labels.count(0)} legitimate, {labels.count(1)} scam)")
    print(f"Test Set Accuracy:  {acc * 100:.2f}%")
    print(f"Test Set Precision: {prec * 100:.2f}%")
    print(f"Test Set Recall:    {rec * 100:.2f}%")
    print(f"Test Set F1-Score:  {f1 * 100:.2f}%")
    print(f"Confusion Matrix (TN, FP, FN, TP):\n{np.array(cm)}")

    model_payload = {
        "pipeline": pipeline,
        "version": "1.0.0-nlp",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "metrics": {
            "accuracy": acc,
            "precision": prec,
            "recall": rec,
            "f1_score": f1,
            "confusion_matrix": cm,
            "dataset_size": len(labels)
        }
    }
    joblib.dump(model_payload, MODEL_DIR / "message_classifier.joblib")
    print(f"Saved Message Classifier model to {MODEL_DIR / 'message_classifier.joblib'}")
    return model_payload

if __name__ == "__main__":
    train_url_model()
    train_message_model()
    print("\nMachine Learning Pipeline Execution Complete!")
