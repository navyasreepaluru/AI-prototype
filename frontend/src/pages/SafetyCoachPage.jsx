import React, { useState } from 'react';
import { 
  GraduationCap, AlertOctagon, PhoneCall, ShieldCheck, 
  CheckCircle2, ArrowRight, HelpCircle, Lock, ExternalLink, 
  RotateCcw, Sparkles, BookOpen, AlertTriangle 
} from 'lucide-react';

const QUIZ_QUESTIONS = [
  {
    id: 1,
    scenario: "You receive an SMS stating: 'Your electricity connection will be cut off tonight at 9:30 PM due to an unpaid bill. Call 9876543210 immediately.'",
    question: "What is the safest and most effective response?",
    options: [
      { text: "Call the number immediately to ask for an extension.", isCorrect: false, explanation: "Never call the phone number inside an unsolicited urgent SMS. Scammers use fake numbers to manipulate you." },
      { text: "Ignore the SMS and check your billing status directly through your official electricity provider portal or app.", isCorrect: true, explanation: "Correct! Legitimate utility boards do not disconnect power via sudden SMS threats. Always verify through official channels." },
      { text: "Pay Rs 100 via UPI to prevent the disconnection temporarily.", isCorrect: false, explanation: "Paying any amount confirms your number is active and gives money to fraudulent personal UPI IDs." },
      { text: "Forward the SMS to family members to warn them.", isCorrect: false, explanation: "Forwarding unverified threat messages spreads panic without solving the issue." }
    ]
  },
  {
    id: 2,
    scenario: "You are directed to a webpage that displays a green padlock icon (HTTPS) with address: 'https://sbi-kyc-update.buzz/login.php'.",
    question: "Does the HTTPS green padlock guarantee that the website is authentic and safe?",
    options: [
      { text: "Yes, HTTPS means the website is officially certified by State Bank of India.", isCorrect: false, explanation: "False! Over 80% of modern phishing websites utilize valid, free SSL certificates." },
      { text: "Yes, only authorized banking institutions can obtain HTTPS certificates.", isCorrect: false, explanation: "Anyone can obtain automated free TLS certificates from providers like Let's Encrypt in seconds." },
      { text: "No, HTTPS only encrypts the connection between your device and the server. It does NOT verify the site's legitimacy.", isCorrect: true, explanation: "Correct! HTTPS only protects data in transit from eavesdroppers. You are simply securely transmitting credentials to a scammer." },
      { text: "Yes, provided the certificate hasn't expired.", isCorrect: false, explanation: "Certificate validity period is irrelevant to whether the website operator is an attacker." }
    ]
  },
  {
    id: 3,
    scenario: "Someone claiming to be from your bank's fraud department calls you and asks for the 6-digit OTP you just received to 'cancel an unauthorized transaction'.",
    question: "What should you do?",
    options: [
      { text: "Share the OTP quickly before the unauthorized transaction goes through.", isCorrect: false, explanation: "Sharing the OTP authorizes the attacker to complete the theft!" },
      { text: "Ask the caller for their employee ID and then give them the OTP.", isCorrect: false, explanation: "Scammers fabricate fake employee IDs and badges easily." },
      { text: "Refuse to share the OTP, hang up immediately, and call the official bank customer support number printed on your debit card.", isCorrect: true, explanation: "Correct! Bank employees NEVER require your OTP. The OTP is your digital signature authorizing a debit." },
      { text: "Tell them the OTP backwards so it fails.", isCorrect: false, explanation: "Engaging with scammers is risky; hang up immediately." }
    ]
  },
  {
    id: 4,
    scenario: "You receive an SMS informing you that a FedEx parcel is held at customs for an unpaid duty fee of Rs 1,499. You haven't ordered anything from overseas.",
    question: "How should you treat this situation?",
    options: [
      { text: "Treat it as an advance-fee phishing scam and report it. Do not tap any links or pay fees.", isCorrect: true, explanation: "Correct! This is a classic parcel delivery phishing campaign targeting thousands of random numbers." },
      { text: "Pay the fee in case someone sent you a surprise gift.", isCorrect: false, explanation: "Surprise gift scams trick victims into paying fraudulent fees for non-existent parcels." },
      { text: "Reply to the SMS asking what is inside the parcel.", isCorrect: false, explanation: "Replying confirms your mobile number is active, leading to more targeted scam attempts." },
      { text: "Install the APK file attached to the email to track the courier.", isCorrect: false, explanation: "Installing unvetted APK files downloads remote-access banking trojans onto your smartphone." }
    ]
  }
];

export default function SafetyCoachPage() {
  const [activeTab, setActiveTab] = useState('panic'); // 'panic', 'guides', 'quiz'
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const handleSelectOption = (questionId, optionIdx) => {
    if (quizSubmitted) return;
    setQuizAnswers({
      ...quizAnswers,
      [questionId]: optionIdx
    });
  };

  const calculateScore = () => {
    let score = 0;
    QUIZ_QUESTIONS.forEach(q => {
      const selected = quizAnswers[q.id];
      if (selected !== undefined && q.options[selected].isCorrect) {
        score += 1;
      }
    });
    return score;
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-2">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Feature 09 • Interactive Safety Coach</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
          Personal Cyber Safety Coach & Learning Center
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-3xl">
          Actionable incident response guides, emergency financial fraud reporting hotlines, and interactive quizzes to test your security instincts.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('panic')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'panic'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          <span>Emergency Incident Response (Panic Protocol)</span>
        </button>

        <button
          onClick={() => setActiveTab('guides')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'guides'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Scam Playbooks & Awareness</span>
        </button>

        <button
          onClick={() => setActiveTab('quiz')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'quiz'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Interactive Cyber Safety Quiz</span>
        </button>
      </div>

      {/* Tab 1: Panic Emergency Protocol */}
      {activeTab === 'panic' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Emergency Alert Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-950/40 via-red-950/30 to-slate-900 border border-rose-800/40 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400 font-bold text-lg">
              <AlertOctagon className="w-6 h-6 animate-pulse" />
              <span>Did you accidentally disclose an OTP, password, or send funds to a scammer?</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              Do not panic. Every minute counts. Follow these prioritized steps immediately to protect your accounts and freeze unauthorized fund transfers.
            </p>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-rose-900/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-rose-500/20 text-rose-400">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-rose-300">National Cyber Crime Helpline (India)</div>
                  <div className="text-2xl font-black font-mono text-slate-100">Dial 1930 (Golden Hour)</div>
                  <div className="text-[11px] text-slate-400">Toll-free 24/7 hotline to freeze disputed inter-bank UPI & IMPS transfers.</div>
                </div>
              </div>
              <a
                href="https://cybercrime.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 shrink-0 shadow-lg"
              >
                <span>cybercrime.gov.in</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Action Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#0c1222] border border-[#1e293b] shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-mono">1</span>
                <span>Freeze Cards & NetBanking Immediately</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Open your official mobile banking application. Use the &quot;Card Controls&quot; or &quot;Debit Card Hotlisting&quot; setting to instantly lock your card and disable international/online POS transactions.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0c1222] border border-[#1e293b] shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-xs font-mono">2</span>
                <span>Reset Primary Email & Bank Passwords</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                If you disclosed your password, change it immediately from a different, clean device. Choose a strong 16+ character passphrase and enforce multi-factor authentication (MFA).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0c1222] border border-[#1e293b] shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-violet-400 font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-mono">3</span>
                <span>Revoke Active Sessions & App Permissions</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Under your Google, Apple, or Microsoft account settings, click &quot;Sign out of all other sessions&quot; and verify that no remote desktop apps (e.g. AnyDesk, TeamViewer) were installed.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0c1222] border border-[#1e293b] shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-mono">4</span>
                <span>Preserve Evidence & File Police Complaint</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Take screenshots of the SMS, caller ID, transaction IDs, and URL. File a formal complaint with the National Cyber Crime Reporting Portal at cybercrime.gov.in.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Scam Playbooks */}
      {activeTab === 'guides' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
          <div className="p-6 rounded-2xl bg-[#0c1222] border border-[#1e293b] shadow-xl space-y-3">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Electricity Bill Disconnection Fraud
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Scammers mass-blast SMS messages claiming your power will be cut off tonight due to unpaid dues. They urge you to call an unofficial mobile number or download an APK that installs screen-sharing malware.
            </p>
            <div className="p-3 rounded-xl bg-slate-950 font-mono text-xs text-cyan-300 border border-slate-800">
              Rule: State electricity boards only issue formal written notices on physical monthly bills. Never dial random numbers sent via SMS.
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0c1222] border border-[#1e293b] shadow-xl space-y-3">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-violet-400" />
              Part-Time Job & Telegram Task Scams
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Victims receive messages promising Rs 3,000 to Rs 8,000 daily for liking YouTube videos or rating Google Maps locations. Initial small rewards are paid to build trust, followed by demands to invest large sums in crypto or &quot;merchant recharge accounts&quot;.
            </p>
            <div className="p-3 rounded-xl bg-slate-950 font-mono text-xs text-violet-300 border border-slate-800">
              Rule: Legitimate employers never require workers to deposit money to unlock earnings.
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0c1222] border border-[#1e293b] shadow-xl space-y-3">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Bank KYC Suspension Phishing
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Messages state that your PAN card is not linked to your SBI or HDFC account and access will be blocked within 24 hours. The link directs to a pixel-perfect replica of the internet banking portal.
            </p>
            <div className="p-3 rounded-xl bg-slate-950 font-mono text-xs text-amber-300 border border-slate-800">
              Rule: Check the URL address bar. SBI is onlinesbi.sbi, never sbi-update.xyz or sbi.com.portal.buzz.
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0c1222] border border-[#1e293b] shadow-xl space-y-3">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Courier Customs Duty Impersonation
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Claims a parcel with tracking #IN... has unpaid customs duties or invalid delivery address. Users are directed to a payment gateway collecting credit card numbers, CVVs, and OTPs.
            </p>
            <div className="p-3 rounded-xl bg-slate-950 font-mono text-xs text-emerald-300 border border-slate-800">
              Rule: If you didn&apos;t order an overseas parcel, you do not owe customs. Verify tracking numbers solely on official carrier apps.
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Interactive Quiz */}
      {activeTab === 'quiz' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-5 rounded-2xl bg-[#0c1222] border border-[#1e293b] shadow-xl flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-100 text-base">Cyber Defense Instincts Challenge</h3>
              <p className="text-xs text-slate-400">Answer practical scenarios to measure your scam resilience</p>
            </div>
            {quizSubmitted && (
              <div className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono font-bold text-sm">
                Score: {calculateScore()} / {QUIZ_QUESTIONS.length} Correct
              </div>
            )}
          </div>

          <div className="space-y-6">
            {QUIZ_QUESTIONS.map((q, qIdx) => {
              const selectedIdx = quizAnswers[q.id];
              return (
                <div
                  key={q.id}
                  className="p-6 rounded-2xl bg-[#0c1222] border border-[#1e293b] shadow-xl space-y-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {qIdx + 1}
                    </span>
                    <div className="space-y-1">
                      <div className="p-3 rounded-xl bg-slate-950 text-slate-300 text-xs italic border border-slate-800">
                        &quot;{q.scenario}&quot;
                      </div>
                      <div className="font-bold text-slate-100 text-sm pt-1">
                        {q.question}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1 pl-9">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = selectedIdx === optIdx;
                      let optionStyle = 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300';
                      
                      if (quizSubmitted) {
                        if (opt.isCorrect) {
                          optionStyle = 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300';
                        } else if (isSelected && !opt.isCorrect) {
                          optionStyle = 'bg-rose-950/40 border-rose-500/60 text-rose-300';
                        }
                      } else if (isSelected) {
                        optionStyle = 'bg-violet-950/40 border-violet-500 text-violet-200';
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          disabled={quizSubmitted}
                          onClick={() => handleSelectOption(q.id, optIdx)}
                          className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-start gap-3 ${optionStyle}`}
                        >
                          <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="flex-1 leading-relaxed">{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback explanation if submitted */}
                  {quizSubmitted && selectedIdx !== undefined && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1 pl-9">
                      <span className="font-semibold text-slate-200 block">Explanation:</span>
                      <p>{q.options[selectedIdx].explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submit / Reset Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            {quizSubmitted ? (
              <button
                onClick={() => {
                  setQuizSubmitted(false);
                  setQuizAnswers({});
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2 border border-slate-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake Quiz</span>
              </button>
            ) : (
              <button
                onClick={() => setQuizSubmitted(true)}
                disabled={Object.keys(quizAnswers).length < QUIZ_QUESTIONS.length}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-semibold text-xs flex items-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Answers & Review Explanations</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
