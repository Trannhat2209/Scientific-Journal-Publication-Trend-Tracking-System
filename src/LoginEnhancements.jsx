import React from "react";
import { useTranslation } from "react-i18next";
import "./loginEnhancements.css";

// Language Switcher Component with i18n
export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);

  const languages = [
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
  ];

  const currentLang =
    languages.find((lang) => lang.code === i18n.language) || languages[0];

  // Close on outside click
  React.useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e) => {
      if (!e.target.closest(".language-dropdown")) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [isOpen]);

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    window.localStorage.setItem("scholartrend.language", langCode);
    setIsOpen(false);
  };

  return (
    <div className="language-switcher">
      <div className="language-dropdown">
        <button
          type="button"
          className="language-button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        >
          <span>{currentLang.flag}</span>
          <span>{currentLang.name}</span>
          <svg viewBox="0 0 24 24">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <div className={`language-menu ${isOpen ? "active" : ""}`}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              className={`language-option ${i18n.language === lang.code ? "selected" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                changeLanguage(lang.code);
              }}
            >
              <span>
                <span>{lang.flag}</span> {lang.name}
              </span>
              {i18n.language === lang.code && (
                <svg
                  className="check-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Help & Support Component
export function HelpSupport() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);

  // Close on outside click
  React.useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e) => {
      if (!e.target.closest(".help-support-button")) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [isOpen]);

  const helpItems = [
    {
      icon: (
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <circle cx="12" cy="17" r="0.5" fill="currentColor" />
        </svg>
      ),
      text: t("login.howToLogin"),
      action: () => {
        alert(
          "📚 " +
            t("login.howToLogin") +
            ":\n\nTo login, enter your email, select your role, and enter your password. Then click Sign In.",
        );
      },
    },
    {
      icon: (
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
      ),
      text: t("login.cantAccess"),
      action: () => {
        alert(
          "🔑 " +
            t("login.cantAccess") +
            ':\n\nIf you cannot access your account, try using the "Forgot password?" link or contact support@scholartrend.test',
        );
      },
    },
    {
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      text: t("login.contactSupport"),
      action: () => {
        alert(
          "📞 " +
            t("login.contactSupport") +
            ":\n\nEmail: support@scholartrend.test\nPhone: +1 (555) 123-4567\nHours: 24/7",
        );
      },
    },
  ];

  return (
    <div className="help-support-button">
      <div className="help-menu-wrapper">
        <div className={`help-menu ${isOpen ? "active" : ""}`}>
          <div className="help-menu-header">{t("login.needHelp")}</div>
          <div className="help-menu-content">
            {helpItems.map((item, index) => (
              <button
                key={index}
                type="button"
                className="help-menu-item"
                onClick={(e) => {
                  e.stopPropagation();
                  item.action();
                  setIsOpen(false);
                }}
              >
                {item.icon}
                <span>{item.text}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="help-button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          title={t("login.needHelp")}
        >
          <svg viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <path d="M12 10v4M12 16h.01" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Password Strength Indicator Component
export function PasswordStrengthIndicator({ password, strength }) {
  const { t } = useTranslation();

  if (!password) return null;

  const getSuggestions = () => {
    const suggestions = [];

    if (password.length < 8) suggestions.push("Use 8+ characters");
    if (!/[A-Z]/.test(password)) suggestions.push("Add uppercase");
    if (!/[a-z]/.test(password)) suggestions.push("Add lowercase");
    if (!/[0-9]/.test(password)) suggestions.push("Add number");
    if (!/[^A-Za-z0-9]/.test(password)) suggestions.push("Add special char");

    return suggestions.length > 0
      ? suggestions.slice(0, 2).join(", ")
      : "✓ Strong password";
  };

  return (
    <div className="password-strength-container">
      <div className="password-strength-bar">
        <div
          className="password-strength-fill"
          style={{
            width: `${strength.score}%`,
            background: strength.color,
          }}
        />
      </div>
      <div className="password-strength-info">
        <span
          className="password-strength-label"
          style={{ color: strength.color }}
        >
          {strength.label}
        </span>
        <span className="password-strength-suggestions">
          {getSuggestions()}
        </span>
      </div>
    </div>
  );
}
