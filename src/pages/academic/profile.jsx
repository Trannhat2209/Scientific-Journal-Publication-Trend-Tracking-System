// Generated module from the former App.jsx.
import React from "react";
import { MiniIcon, apiFetch, authServerFetch, getAcademicPath, getStoredAuth, getStoredSession, normalizeRoleForUi, persistSession, profileTabs } from "../../app/core.jsx";
import { ResearcherShell, StudentSidebar, StudentTopbar } from "./shell.jsx";

function ProfileTabs({ activeTab, setActiveTab }) {
  return (
    <nav className="profile-tabs" aria-label="Profile settings">
      {profileTabs.map((tab) => (
        <button
          className={activeTab === tab.label ? "active" : ""}
          type="button"
          key={tab.label}
          onClick={() => setActiveTab(tab.label)}
        >
          <MiniIcon path={tab.icon} />
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

function ProfileField({
  label,
  value,
  onChange,
  readOnly = false,
  locked = false,
  type = "text",
}) {
  return (
    <label className="profile-field">
      <span>{label}</span>
      <span className={`profile-input ${locked ? "locked" : ""}`}>
        <input
          type={type}
          value={value}
          readOnly={readOnly}
          onChange={(event) => onChange?.(event.target.value)}
        />
        {locked ? (
          <MiniIcon path="M6 10h12v9H6zM8.5 10V7.8a3.5 3.5 0 0 1 7 0V10" />
        ) : null}
      </span>
    </label>
  );
}

function ProfilePage({ role = "student" }) {
  const accountSession = getStoredSession();
  const accountEmail = String(accountSession.email || "")
    .trim()
    .toLowerCase();
  const accountRole = normalizeRoleForUi(accountSession.role || role);
  const [activeTab, setActiveTab] = React.useState(() =>
    new URLSearchParams(window.location.search).get("tab") ===
    "academic-identity"
      ? "Academic Identity"
      : "Personal Info",
  );
  const isAcademic = role === "researcher" || role === "lecturer";
  const academicRole = role === "lecturer" ? "lecturer" : "researcher";
  const avatarInputRef = React.useRef(null);
  const storageKey = `scholartrend.profile.${encodeURIComponent(
    accountEmail || role,
  )}`;
  const defaultProfileData = {
    personal: {
      fullName:
        accountSession.fullName ||
        accountSession.name ||
        accountEmail ||
        "ScholarTrend User",
      email: accountEmail,
      institution: accountSession.institution || "",
      department: accountSession.department || "",
      roleBadge: accountRole,
      avatarUrl: accountSession.avatarUrl || accountSession.picture || "",
    },
    academicIdentity: {
      institution: accountSession.institution || "",
      department: accountSession.department || "",
      institutionalEmail: "",
      identifier: "",
      programOrField: "",
      evidenceUrl: "",
      verificationStatus: "not_submitted",
      requestedRole: "",
    },
    interests: [
      "Deep Learning",
      "Computational Biology",
      "Quantum Computing",
      "Single-cell RNA",
    ],
    preferences: {
      realTimeAlerts: true,
      weeklyDigest: true,
      systemAlerts: false,
      semanticScholar: true,
      openAlex: true,
    },
    notifications: {
      publicationMatches: true,
      weeklyTrendingDigest: true,
      citationAlerts: false,
      collaborationInvites: true,
      realtimePublicationAlerts: true,
      syncStatusUpdates: true,
      systemAnnouncements: false,
      frequency: "Daily digest",
    },
    privacy: {
      visibility: "Public",
      sharePublicationData: true,
      externalIndexing: false,
      researchAnalytics: true,
      twoFactorEnabled: false,
      signedOutAllDevices: false,
    },
  };
  const loadProfileData = React.useCallback(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return defaultProfileData;
    try {
      const parsed = JSON.parse(saved);
      return {
        ...defaultProfileData,
        ...parsed,
        personal: {
          ...defaultProfileData.personal,
          ...(parsed.personal || {}),
          email: accountEmail,
          roleBadge: accountRole,
        },
        preferences: {
          ...defaultProfileData.preferences,
          ...(parsed.preferences || {}),
        },
        notifications: {
          ...defaultProfileData.notifications,
          ...(parsed.notifications || {}),
        },
        privacy: { ...defaultProfileData.privacy, ...(parsed.privacy || {}) },
        academicIdentity: {
          ...defaultProfileData.academicIdentity,
          ...(parsed.academicIdentity || {}),
        },
        interests: Array.isArray(parsed.interests)
          ? parsed.interests
          : defaultProfileData.interests,
      };
    } catch {
      return defaultProfileData;
    }
  }, [storageKey, accountEmail, accountRole]);
  const [profileData, setProfileData] = React.useState(loadProfileData);
  const [savedProfileData, setSavedProfileData] = React.useState(profileData);
  const [roleChangeDraft, setRoleChangeDraft] = React.useState(() => ({
    institution: "",
    department: "",
    institutionalEmail: "",
    identifier: "",
    programOrField: "",
    evidenceUrl: "",
    requestedRole: accountRole === "Researcher" ? "Lecturer" : "Researcher",
  }));

  React.useEffect(() => {
    const pendingRole = profileData.academicIdentity.requestedRole;
    if (!pendingRole) return;
    setRoleChangeDraft({
      institution: profileData.academicIdentity.institution || "",
      department: profileData.academicIdentity.department || "",
      institutionalEmail:
        profileData.academicIdentity.institutionalEmail || "",
      identifier: profileData.academicIdentity.identifier || "",
      programOrField: profileData.academicIdentity.programOrField || "",
      evidenceUrl: profileData.academicIdentity.evidenceUrl || "",
      requestedRole: pendingRole,
    });
  }, [
    profileData.academicIdentity.requestedRole,
    profileData.academicIdentity.institution,
    profileData.academicIdentity.department,
    profileData.academicIdentity.institutionalEmail,
    profileData.academicIdentity.identifier,
    profileData.academicIdentity.programOrField,
    profileData.academicIdentity.evidenceUrl,
  ]);
  const [newInterest, setNewInterest] = React.useState("");
  const [profileMessage, setProfileMessage] = React.useState("");
  const [institutionalEmailCode, setInstitutionalEmailCode] = React.useState("");
  const [passwords, setPasswords] = React.useState({
    current: "",
    next: "",
    confirm: "",
  });

  React.useEffect(() => {
    let cancelled = false;
    const profileRequest = getStoredAuth().accessToken
      ? apiFetch("/api/auth/profile", { auth: true })
      : authServerFetch("/api/auth/profile");

    profileRequest
      .then((backendProfile) => {
        if (cancelled) return;
        setProfileData((current) => {
          const next = {
            ...current,
            personal: {
              ...current.personal,
              fullName: backendProfile.fullName || current.personal.fullName,
              email: backendProfile.email || current.personal.email,
              institution:
                backendProfile.institution ?? current.personal.institution,
              department:
                backendProfile.department ?? current.personal.department,
              avatarUrl: backendProfile.avatarUrl ?? current.personal.avatarUrl,
              roleBadge: normalizeRoleForUi(backendProfile.role),
            },
            academicIdentity: {
              ...current.academicIdentity,
              ...(backendProfile.academicIdentity || {}),
              institution:
                backendProfile.academicIdentity?.institution ||
                backendProfile.institution ||
                current.academicIdentity.institution,
              department:
                backendProfile.academicIdentity?.department ||
                backendProfile.department ||
                current.academicIdentity.department,
              institutionalEmail:
                backendProfile.academicIdentity?.institutionalEmail ||
                backendProfile.institutionalEmail ||
                current.academicIdentity.institutionalEmail,
              identifier:
                backendProfile.academicIdentity?.identifier ||
                backendProfile.academicIdentifier ||
                current.academicIdentity.identifier,
              programOrField:
                backendProfile.academicIdentity?.programOrField ||
                backendProfile.programOrField ||
                current.academicIdentity.programOrField,
              evidenceUrl:
                backendProfile.academicIdentity?.evidenceUrl ||
                backendProfile.evidenceUrl ||
                current.academicIdentity.evidenceUrl,
              verificationStatus:
                backendProfile.verificationStatus ||
                current.academicIdentity.verificationStatus,
              requestedRole:
                backendProfile.requestedRole ??
                current.academicIdentity.requestedRole ??
                "",
            },
          };
          window.localStorage.setItem(storageKey, JSON.stringify(next));
          persistSession({
            ...getStoredSession(),
            fullName: next.personal.fullName,
            name: next.personal.fullName,
            role: next.personal.roleBadge,
            academicIdentity: next.academicIdentity,
            verificationStatus: next.academicIdentity.verificationStatus,
            requestedRole: next.academicIdentity.requestedRole || "",
          });
          setSavedProfileData(next);
          return next;
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const updatePersonalField = (field, value) => {
    setProfileData((current) => ({
      ...current,
      personal: { ...current.personal, [field]: value },
    }));
    setProfileMessage("");
  };

  const updateNestedProfileField = (group, field, value) => {
    setProfileData((current) => ({
      ...current,
      [group]: { ...current[group], [field]: value },
    }));
    setProfileMessage("");
  };

  const handleRequestedRoleChange = (nextRole) => {
    setRoleChangeDraft((current) => ({
      ...current,
        requestedRole: nextRole === accountRole ? "" : nextRole,
      identifier: "",
      programOrField: "",
      evidenceUrl: "",
    }));
    setProfileMessage(
      nextRole === accountRole
        ? `The current ${accountRole} role will be kept.`
        : `Enter the ${nextRole} identifier, field, and verification evidence before saving.`,
    );
  };

  const handleProfileAvatarUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setProfileMessage("Please choose an image file.");
      event.target.value = "";
      return;
    }
    if (file.size > 800 * 1024) {
      setProfileMessage("Avatar image must be 800K or smaller.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updatePersonalField("avatarUrl", reader.result);
      setProfileMessage("Avatar selected. Press Save Changes to keep it.");
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const removeProfileAvatar = () => {
    updatePersonalField("avatarUrl", "");
    setProfileMessage("Avatar removed. Press Save Changes to keep it.");
  };

  const addProfileInterest = (event) => {
    event.preventDefault();
    const value = newInterest.trim();
    if (!value) return;
    setProfileData((current) => ({
      ...current,
      interests: current.interests.includes(value)
        ? current.interests
        : [...current.interests, value],
    }));
    setNewInterest("");
    setProfileMessage("");
  };

  const removeProfileInterest = (interest) => {
    setProfileData((current) => ({
      ...current,
      interests: current.interests.filter((item) => item !== interest),
    }));
    setProfileMessage("");
  };

  const saveProfileChanges = async () => {
    if (passwords.next || passwords.confirm || passwords.current) {
      if (
        !passwords.current ||
        !passwords.next ||
        passwords.next !== passwords.confirm
      ) {
        setProfileMessage(
          "Check your current password and matching new password.",
        );
        return;
      }
    }

    const isRoleChangeRequest = activeTab === "Role Change Request";
    const isIdentitySubmission =
      activeTab === "Academic Identity" || isRoleChangeRequest;
    const identity = isRoleChangeRequest
      ? roleChangeDraft
      : profileData.academicIdentity;
    if (
      isIdentitySubmission &&
      (!identity.institution ||
        !identity.department ||
        !identity.institutionalEmail ||
        !identity.identifier ||
        !identity.programOrField ||
        !identity.evidenceUrl)
    ) {
      setProfileMessage(
        "Institution, department, official email, role identifier, program or field, and evidence URL are required for verification.",
      );
      return;
    }

    try {
      let nextProfileData = profileData;
      if (getStoredAuth().accessToken) {
        const backendProfile = await apiFetch("/api/auth/profile", {
          method: "PUT",
          auth: true,
          body: {
            fullName: profileData.personal.fullName,
            ...(isIdentitySubmission
              ? {
                  institution: identity.institution,
                  department: identity.department,
                  institutionalEmail: identity.institutionalEmail,
                  academicIdentifier: identity.identifier,
                  programOrField: identity.programOrField,
                  evidenceUrl: identity.evidenceUrl,
                  requestedRole: isRoleChangeRequest
                    ? identity.requestedRole
                    : accountRole,
                }
              : {}),
          },
        });
        if (passwords.current && passwords.next) {
          await apiFetch("/api/auth/change-password", {
            method: "POST",
            auth: true,
            body: {
              currentPassword: passwords.current,
              newPassword: passwords.next,
            },
          });
        }
        nextProfileData = {
          ...profileData,
          personal: {
            ...profileData.personal,
            fullName: backendProfile.fullName || profileData.personal.fullName,
            email: backendProfile.email || profileData.personal.email,
            roleBadge: normalizeRoleForUi(backendProfile.role),
          },
          academicIdentity: {
            ...(isRoleChangeRequest ? identity : profileData.academicIdentity),
            ...(backendProfile.academicIdentity || {}),
            institution:
              backendProfile.institution ??
              (isRoleChangeRequest
                ? identity.institution
                : profileData.academicIdentity.institution),
            department:
              backendProfile.department ??
              (isRoleChangeRequest
                ? identity.department
                : profileData.academicIdentity.department),
            institutionalEmail:
              backendProfile.institutionalEmail ??
              (isRoleChangeRequest
                ? identity.institutionalEmail
                : profileData.academicIdentity.institutionalEmail),
            identifier:
              backendProfile.academicIdentifier ??
              (isRoleChangeRequest
                ? identity.identifier
                : profileData.academicIdentity.identifier),
            programOrField:
              backendProfile.programOrField ??
              (isRoleChangeRequest
                ? identity.programOrField
                : profileData.academicIdentity.programOrField),
            evidenceUrl:
              backendProfile.evidenceUrl ??
              (isRoleChangeRequest
                ? identity.evidenceUrl
                : profileData.academicIdentity.evidenceUrl),
            verificationStatus:
              backendProfile.verificationStatus ||
              profileData.academicIdentity.verificationStatus,
            requestedRole: backendProfile.requestedRole || "",
          },
        };
      } else {
        const backendProfile = await authServerFetch("/api/auth/profile", {
          method: "PUT",
          body: {
            fullName: profileData.personal.fullName,
            institution: profileData.personal.institution,
            department: profileData.personal.department,
            avatarUrl: profileData.personal.avatarUrl,
            ...(isIdentitySubmission
              ? {
                  academicIdentity: {
                    ...identity,
                    requestedRole: isRoleChangeRequest
                      ? identity.requestedRole
                      : accountRole,
                  },
                }
              : {}),
          },
        });
        nextProfileData = {
          ...profileData,
          personal: {
            ...profileData.personal,
            fullName: backendProfile.fullName,
            email: backendProfile.email,
            institution: backendProfile.institution || "",
            department: backendProfile.department || "",
            avatarUrl: backendProfile.avatarUrl || "",
            roleBadge: normalizeRoleForUi(backendProfile.role),
          },
        };
      }

      if (!getStoredAuth().accessToken && isIdentitySubmission) {
        nextProfileData = {
          ...nextProfileData,
          academicIdentity: {
            ...nextProfileData.academicIdentity,
            ...(nextProfileData.academicIdentity || {}),
            verificationStatus: "pending",
          },
        };
      }

      window.localStorage.setItem(storageKey, JSON.stringify(nextProfileData));
      persistSession({
        ...getStoredSession(),
        fullName: nextProfileData.personal.fullName,
        name: nextProfileData.personal.fullName,
        picture: nextProfileData.personal.avatarUrl,
        avatarUrl: nextProfileData.personal.avatarUrl,
        institution: nextProfileData.personal.institution,
        department: nextProfileData.personal.department,
        academicIdentity: nextProfileData.academicIdentity,
        verificationStatus:
          nextProfileData.academicIdentity.verificationStatus,
        requestedRole: nextProfileData.academicIdentity.requestedRole || "",
        role: nextProfileData.personal.roleBadge,
      });
      setProfileData(nextProfileData);
      setSavedProfileData(nextProfileData);
      setPasswords({ current: "", next: "", confirm: "" });
      setProfileMessage(
        isRoleChangeRequest
          ? `Role change request to ${identity.requestedRole} was sent to Admin successfully.`
          : "Profile changes saved successfully.",
      );
    } catch (error) {
      setProfileMessage(error.message);
    }
  };

  const cancelProfileChanges = () => {
    setProfileData(savedProfileData);
    setRoleChangeDraft({
      institution: "",
      department: "",
      institutionalEmail: "",
      identifier: "",
      programOrField: "",
      evidenceUrl: "",
      requestedRole:
        accountRole === "Researcher" ? "Lecturer" : "Researcher",
    });
    setPasswords({ current: "", next: "", confirm: "" });
    setNewInterest("");
    setProfileMessage("Unsaved changes were discarded.");
  };

  const verifyInstitutionalEmail = async () => {
    try {
      const backendProfile = await apiFetch(
        "/api/auth/verify-institutional-email",
        { method: "POST", auth: true, body: { token: institutionalEmailCode } },
      );
      setProfileData((current) => ({
        ...current,
        academicIdentity: {
          ...current.academicIdentity,
          verificationStatus: backendProfile.verificationStatus,
          isInstitutionalEmailVerified:
            backendProfile.isInstitutionalEmailVerified,
        },
      }));
      setInstitutionalEmailCode("");
      setProfileMessage("Institutional email verified. Your request is now pending Admin review.");
    } catch (error) {
      setProfileMessage(error.message);
    }
  };

  const identityRoleConfig = {
    Student: {
      institution: "University / College",
      identifier: "Student ID",
      program: "Program / Major",
      hint: "Use your official student ID and school email.",
    },
    Lecturer: {
      institution: "University / Institution",
      identifier: "Staff / Faculty ID",
      program: "Faculty / Teaching Department",
      hint: "Use your faculty ID and official institutional email.",
    },
    Researcher: {
      institution: "Research Institution / University",
      identifier: "ORCID or Researcher ID",
      program: "Research Field / Laboratory",
      hint: "Use an ORCID or researcher ID that Admin can verify.",
    },
  };
  const requestedIdentityRole =
    roleChangeDraft.requestedRole ||
    profileData.academicIdentity.requestedRole ||
    (accountRole === "Researcher" ? "Lecturer" : "Researcher");
  const identityConfig =
    identityRoleConfig[requestedIdentityRole] || identityRoleConfig.Student;
  const currentIdentityConfig =
    identityRoleConfig[accountRole] || identityRoleConfig.Student;

  const pageContent = (
    <div
      className={
        isAcademic
          ? "researcher-profile-content profile-content"
          : "student-content profile-content"
      }
    >
      <h1>User Profile</h1>
      <p className="profile-subtitle">
        Manage your personal information, security, and academic preferences.
      </p>

      <div className="profile-layout">
        <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {activeTab === "Personal Info" && (
          <section className="profile-card" aria-label="Personal information">
            <div className="profile-card-header">
              <h2>Personal Information</h2>
              <span>{profileData.personal.roleBadge}</span>
            </div>

            <div className="profile-photo-row">
              <button
                type="button"
                className="profile-photo"
                aria-label="Change profile photo"
                onClick={() => avatarInputRef.current?.click()}
              >
                {profileData.personal.avatarUrl ? (
                  <img
                    src={profileData.personal.avatarUrl}
                    alt={profileData.personal.fullName}
                  />
                ) : (
                  <span>
                    {profileData.personal.fullName.trim().charAt(0) || "A"}
                  </span>
                )}
              </button>
              <input
                ref={avatarInputRef}
                className="profile-avatar-input"
                type="file"
                accept="image/*"
                onChange={handleProfileAvatarUpload}
              />
              <div className="profile-upload-actions">
                <div>
                  <button
                    type="button"
                    className="upload-button"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    Upload New
                  </button>
                  <button
                    type="button"
                    className="remove-button"
                    onClick={removeProfileAvatar}
                    disabled={!profileData.personal.avatarUrl}
                  >
                    Remove
                  </button>
                </div>
                <p>JPG, GIF or PNG. Max size of 800K</p>
              </div>
            </div>

            <div className="profile-form-grid">
              <ProfileField
                label="Full Name"
                value={profileData.personal.fullName}
                onChange={(value) => updatePersonalField("fullName", value)}
              />
              <ProfileField
                label="Email Address (Read-only)"
                value={profileData.personal.email}
                readOnly
                locked
              />
            </div>
          </section>
        )}

        {activeTab === "Academic Identity" && (
          <section
            className="profile-card academic-identity-card"
            aria-label="Academic identity"
          >
            <div className="profile-card-header">
              <h2>Academic Identity</h2>
              <span
                className={`identity-verification-status ${
                  profileData.academicIdentity.requestedRole
                    ? "verified"
                    : profileData.academicIdentity.verificationStatus
                }`}
              >
                {profileData.academicIdentity.requestedRole
                  ? "Current Role Active"
                  : profileData.academicIdentity.verificationStatus === "verified"
                  ? "Admin Verified"
                  : profileData.academicIdentity.verificationStatus ===
                      "pending"
                    ? "Pending Admin Review"
                    : profileData.academicIdentity.verificationStatus ===
                        "rejected"
                      ? "Verification Rejected"
                      : "Not Submitted"}
              </span>
            </div>

            <div className="academic-verification-intro">
              <strong>{accountRole} identity verification</strong>
              <p>
                {currentIdentityConfig.hint} This section belongs to your
                current role.
              </p>
            </div>

            <div className="profile-form-grid academic-verification-grid">
              <ProfileField
                label={currentIdentityConfig.institution}
                value={profileData.academicIdentity.institution}
                onChange={(value) =>
                  updateNestedProfileField(
                    "academicIdentity",
                    "institution",
                    value,
                  )
                }
              />
              <ProfileField
                label="Official Institutional Email"
                value={profileData.academicIdentity.institutionalEmail}
                type="email"
                onChange={(value) =>
                  updateNestedProfileField(
                    "academicIdentity",
                    "institutionalEmail",
                    value,
                  )
                }
              />
              <ProfileField
                label={currentIdentityConfig.identifier}
                value={profileData.academicIdentity.identifier}
                onChange={(value) =>
                  updateNestedProfileField(
                    "academicIdentity",
                    "identifier",
                    value,
                  )
                }
              />
              <ProfileField
                label={currentIdentityConfig.program}
                value={profileData.academicIdentity.programOrField}
                onChange={(value) =>
                  updateNestedProfileField(
                    "academicIdentity",
                    "programOrField",
                    value,
                  )
                }
              />
              <ProfileField
                label="Department / Unit"
                value={profileData.academicIdentity.department}
                onChange={(value) =>
                  updateNestedProfileField(
                    "academicIdentity",
                    "department",
                    value,
                  )
                }
              />
              <ProfileField
                label="Verification URL (institution profile, ORCID, or directory)"
                value={profileData.academicIdentity.evidenceUrl}
                type="url"
                onChange={(value) =>
                  updateNestedProfileField(
                    "academicIdentity",
                    "evidenceUrl",
                    value,
                  )
                }
              />
            </div>

          </section>
        )}

        {activeTab === "Role Change Request" && (
          <section
            className="profile-card academic-identity-card role-change-request-card"
            aria-label="Role change request"
          >
            <div className="profile-card-header">
              <div>
                <h2>Role Change Request</h2>
                <p>
                  Current role: <strong>{accountRole}</strong>
                </p>
              </div>
              {profileData.academicIdentity.requestedRole ? (
                <span className="identity-verification-status pending">
                  {profileData.academicIdentity.requestedRole} pending
                </span>
              ) : null}
            </div>

            <div className="academic-verification-intro">
              <strong>Apply for another academic role</strong>
              <p>
                Select a new role and provide new evidence for that role. Your
                current {accountRole} access remains unchanged until Admin
                approves the request.
              </p>
            </div>

            <div className="profile-field role-change-field">
              <span>Choose the role you want to apply for</span>
              <div
                className="role-change-options"
                role="group"
                aria-label="Choose a new academic role"
              >
                {["Student", "Lecturer", "Researcher"]
                  .filter((option) => option !== accountRole)
                  .map((option) => (
                    <button
                      type="button"
                      className={
                        requestedIdentityRole === option ? "selected" : ""
                      }
                      aria-pressed={requestedIdentityRole === option}
                      onClick={() => handleRequestedRoleChange(option)}
                      key={option}
                    >
                      <strong>{option}</strong>
                      <small>Apply for {option}</small>
                    </button>
                  ))}
              </div>
            </div>

            <div className="profile-form-grid academic-verification-grid role-change-evidence-grid">
              <ProfileField
                label={identityConfig.institution}
                value={roleChangeDraft.institution}
                onChange={(value) =>
                  setRoleChangeDraft((current) => ({
                    ...current,
                    institution: value,
                  }))
                }
              />
              <ProfileField
                label="Official Institutional Email"
                value={roleChangeDraft.institutionalEmail}
                type="email"
                onChange={(value) =>
                  setRoleChangeDraft((current) => ({
                    ...current,
                    institutionalEmail: value,
                  }))
                }
              />
              <ProfileField
                label={identityConfig.identifier}
                value={roleChangeDraft.identifier}
                onChange={(value) =>
                  setRoleChangeDraft((current) => ({
                    ...current,
                    identifier: value,
                  }))
                }
              />
              <ProfileField
                label={identityConfig.program}
                value={roleChangeDraft.programOrField}
                onChange={(value) =>
                  setRoleChangeDraft((current) => ({
                    ...current,
                    programOrField: value,
                  }))
                }
              />
              <ProfileField
                label="Department / Unit"
                value={roleChangeDraft.department}
                onChange={(value) =>
                  setRoleChangeDraft((current) => ({
                    ...current,
                    department: value,
                  }))
                }
              />
              <ProfileField
                label="Verification URL (institution profile, ORCID, or directory)"
                value={roleChangeDraft.evidenceUrl}
                type="url"
                onChange={(value) =>
                  setRoleChangeDraft((current) => ({
                    ...current,
                    evidenceUrl: value,
                  }))
                }
              />
            </div>
          </section>
        )}

        {activeTab === "Change Password" && (
          <section className="profile-card" aria-label="Change password">
            <div className="profile-card-header">
              <h2>Change Password</h2>
              <span>Security</span>
            </div>
            <div className="profile-form-grid">
              <label className="profile-field" style={{ gridColumn: "span 2" }}>
                <span>Current Password</span>
                <span className="profile-input">
                  <input
                    type="password"
                    value={passwords.current}
                    onChange={(event) =>
                      setPasswords((current) => ({
                        ...current,
                        current: event.target.value,
                      }))
                    }
                    placeholder="Current password"
                    style={{ maxWidth: "45%" }}
                  />
                </span>
              </label>
              <label className="profile-field">
                <span>New Password</span>
                <span className="profile-input">
                  <input
                    type="password"
                    value={passwords.next}
                    onChange={(event) =>
                      setPasswords((current) => ({
                        ...current,
                        next: event.target.value,
                      }))
                    }
                    placeholder="New password"
                  />
                </span>
              </label>
              <label className="profile-field">
                <span>Confirm New Password</span>
                <span className="profile-input">
                  <input
                    type="password"
                    value={passwords.confirm}
                    onChange={(event) =>
                      setPasswords((current) => ({
                        ...current,
                        confirm: event.target.value,
                      }))
                    }
                    placeholder="Confirm new password"
                  />
                </span>
              </label>
            </div>
          </section>
        )}

        {activeTab === "Research Interests" && (
          <section className="profile-card" aria-label="Research interests">
            <div className="profile-card-header">
              <h2>Research Interests</h2>
              <span>Academic Interests</span>
            </div>
            <p
              style={{
                fontSize: "13px",
                color: "#4b5563",
                marginBottom: "20px",
              }}
            >
              Manage the research keywords and topics you follow to customize
              your dashboard feeds and alert notifications.
            </p>
            <div className="keyword-chips" style={{ marginBottom: "20px" }}>
              {profileData.interests.map((interest) => (
                <span key={interest}>
                  {interest}{" "}
                  <button
                    type="button"
                    aria-label={`Remove ${interest}`}
                    style={{ cursor: "pointer" }}
                    onClick={() => removeProfileInterest(interest)}
                  >
                    x
                  </button>
                </span>
              ))}
              <form
                className="profile-interest-form"
                onSubmit={addProfileInterest}
              >
                <input
                  value={newInterest}
                  onChange={(event) => setNewInterest(event.target.value)}
                  placeholder="Add keyword"
                  aria-label="Add research keyword"
                />
                <button
                  type="submit"
                  style={{ borderStyle: "dashed", cursor: "pointer" }}
                >
                  + Add Keyword
                </button>
              </form>
            </div>
          </section>
        )}

        {activeTab === "Preferences" && (
          <section className="profile-card" aria-label="Preferences">
            <div className="profile-card-header">
              <h2>System Preferences</h2>
              <span>Preferences</span>
            </div>
            <div style={{ display: "grid", gap: "20px" }}>
              <div>
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: "800",
                    marginBottom: "10px",
                    color: "#111827",
                  }}
                >
                  Notification Frequency
                </h3>
                <div style={{ display: "grid", gap: "10px" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "13px",
                      color: "#374151",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={profileData.preferences.realTimeAlerts}
                      onChange={(event) =>
                        updateNestedProfileField(
                          "preferences",
                          "realTimeAlerts",
                          event.target.checked,
                        )
                      }
                      style={{ width: "16px", height: "16px", margin: 0 }}
                    />{" "}
                    Real-time alerts for new publication matches
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "13px",
                      color: "#374151",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={profileData.preferences.weeklyDigest}
                      onChange={(event) =>
                        updateNestedProfileField(
                          "preferences",
                          "weeklyDigest",
                          event.target.checked,
                        )
                      }
                      style={{ width: "16px", height: "16px", margin: 0 }}
                    />{" "}
                    Weekly summary email digest
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "13px",
                      color: "#374151",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={profileData.preferences.systemAlerts}
                      onChange={(event) =>
                        updateNestedProfileField(
                          "preferences",
                          "systemAlerts",
                          event.target.checked,
                        )
                      }
                      style={{ width: "16px", height: "16px", margin: 0 }}
                    />{" "}
                    System health & sync status alerts
                  </label>
                </div>
              </div>
              <div
                style={{ borderTop: "1px solid #e5e7eb", paddingTop: "15px" }}
              >
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: "800",
                    marginBottom: "10px",
                    color: "#111827",
                  }}
                >
                  Default Search Sources
                </h3>
                <div style={{ display: "grid", gap: "10px" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "13px",
                      color: "#374151",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={profileData.preferences.semanticScholar}
                      onChange={(event) =>
                        updateNestedProfileField(
                          "preferences",
                          "semanticScholar",
                          event.target.checked,
                        )
                      }
                      style={{ width: "16px", height: "16px", margin: 0 }}
                    />{" "}
                    Semantic Scholar API
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "13px",
                      color: "#374151",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={profileData.preferences.openAlex}
                      onChange={(event) =>
                        updateNestedProfileField(
                          "preferences",
                          "openAlex",
                          event.target.checked,
                        )
                      }
                      style={{ width: "16px", height: "16px", margin: 0 }}
                    />{" "}
                    OpenAlex Database
                  </label>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === "Notification Settings" && (
          <section className="profile-card" aria-label="Notification settings">
            <div className="profile-card-header">
              <h2>Notification Settings</h2>
              <span>Manage Alerts</span>
            </div>
            <div style={{ display: "grid", gap: "24px" }}>
              <div>
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    marginBottom: "12px",
                    color: "#111827",
                  }}
                >
                  Email Notifications
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  {[
                    {
                      key: "publicationMatches",
                      label: "New publications matching your interests",
                    },
                    {
                      key: "weeklyTrendingDigest",
                      label: "Weekly digest of trending papers",
                    },
                    {
                      key: "citationAlerts",
                      label: "Citation alerts for your publications",
                    },
                    {
                      key: "collaborationInvites",
                      label: "Collaboration invitations",
                    },
                  ].map((item, i) => (
                    <label
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        fontSize: "14px",
                        color: "#374151",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={profileData.notifications[item.key]}
                        onChange={(event) =>
                          updateNestedProfileField(
                            "notifications",
                            item.key,
                            event.target.checked,
                          )
                        }
                        style={{
                          width: "18px",
                          height: "18px",
                          margin: 0,
                          cursor: "pointer",
                        }}
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    marginBottom: "12px",
                    color: "#111827",
                  }}
                >
                  In-App Notifications
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  {[
                    {
                      key: "realtimePublicationAlerts",
                      label: "Real-time publication alerts",
                    },
                    { key: "syncStatusUpdates", label: "Sync status updates" },
                    {
                      key: "systemAnnouncements",
                      label: "System announcements",
                    },
                  ].map((item, i) => (
                    <label
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        fontSize: "14px",
                        color: "#374151",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={profileData.notifications[item.key]}
                        onChange={(event) =>
                          updateNestedProfileField(
                            "notifications",
                            item.key,
                            event.target.checked,
                          )
                        }
                        style={{
                          width: "18px",
                          height: "18px",
                          margin: 0,
                          cursor: "pointer",
                        }}
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    marginBottom: "8px",
                    color: "#111827",
                  }}
                >
                  Notification Frequency
                </h3>
                <select
                  value={profileData.notifications.frequency}
                  onChange={(event) =>
                    updateNestedProfileField(
                      "notifications",
                      "frequency",
                      event.target.value,
                    )
                  }
                  style={{
                    width: "100%",
                    height: "40px",
                    padding: "0 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    fontSize: "14px",
                    color: "#374151",
                  }}
                >
                  <option>Real-time (as it happens)</option>
                  <option>Daily digest</option>
                  <option>Weekly summary</option>
                </select>
              </div>
            </div>
          </section>
        )}

        {activeTab === "Privacy & Security" && (
          <section className="profile-card" aria-label="Privacy and security">
            <div className="profile-card-header">
              <h2>Privacy & Security</h2>
              <span>Account Protection</span>
            </div>
            <div style={{ display: "grid", gap: "24px" }}>
              <div>
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    marginBottom: "12px",
                    color: "#111827",
                  }}
                >
                  Profile Visibility
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  {[
                    ["Public", "Public - Visible to all ScholarTrend users"],
                    [
                      "Institution Only",
                      "Institution Only - Visible to your institution",
                    ],
                    ["Private", "Private - Only you can see your profile"],
                  ].map(([value, label]) => (
                    <label
                      key={value}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        fontSize: "14px",
                        color: "#374151",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="visibility"
                        checked={profileData.privacy.visibility === value}
                        onChange={() =>
                          updateNestedProfileField(
                            "privacy",
                            "visibility",
                            value,
                          )
                        }
                        style={{ margin: 0, cursor: "pointer" }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    marginBottom: "12px",
                    color: "#111827",
                  }}
                >
                  Data Sharing
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  {[
                    {
                      key: "sharePublicationData",
                      label: "Share publication data with collaborators",
                    },
                    {
                      key: "externalIndexing",
                      label: "Allow indexing by external search engines",
                    },
                    {
                      key: "researchAnalytics",
                      label: "Participate in research analytics",
                    },
                  ].map((item, i) => (
                    <label
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        fontSize: "14px",
                        color: "#374151",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={profileData.privacy[item.key]}
                        onChange={(event) =>
                          updateNestedProfileField(
                            "privacy",
                            item.key,
                            event.target.checked,
                          )
                        }
                        style={{
                          width: "18px",
                          height: "18px",
                          margin: 0,
                          cursor: "pointer",
                        }}
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    marginBottom: "12px",
                    color: "#111827",
                  }}
                >
                  Two-Factor Authentication
                </h3>
                <div
                  style={{
                    padding: "16px",
                    background: "#f1f5f9",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#111827",
                          marginBottom: "4px",
                        }}
                      >
                        2FA Status:{" "}
                        <span
                          style={{
                            color: profileData.privacy.twoFactorEnabled
                              ? "#059669"
                              : "#ef4444",
                          }}
                        >
                          {profileData.privacy.twoFactorEnabled
                            ? "Enabled"
                            : "Disabled"}
                        </span>
                      </div>
                      <div style={{ fontSize: "13px", color: "#64748b" }}>
                        Add an extra layer of security to your account
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateNestedProfileField(
                          "privacy",
                          "twoFactorEnabled",
                          !profileData.privacy.twoFactorEnabled,
                        )
                      }
                      style={{
                        padding: "8px 16px",
                        background: "#4f46e5",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {profileData.privacy.twoFactorEnabled
                        ? "Disable 2FA"
                        : "Enable 2FA"}
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    marginBottom: "8px",
                    color: "#111827",
                  }}
                >
                  Active Sessions
                </h3>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    marginBottom: "12px",
                  }}
                >
                  {profileData.privacy.signedOutAllDevices
                    ? "Other devices have been signed out"
                    : "You're currently logged in on 2 devices"}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateNestedProfileField(
                      "privacy",
                      "signedOutAllDevices",
                      true,
                    )
                  }
                  disabled={profileData.privacy.signedOutAllDevices}
                  style={{
                    padding: "8px 16px",
                    background: "white",
                    color: "#ef4444",
                    border: "1px solid #ef4444",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: profileData.privacy.signedOutAllDevices
                      ? "not-allowed"
                      : "pointer",
                    opacity: profileData.privacy.signedOutAllDevices ? 0.65 : 1,
                  }}
                >
                  {profileData.privacy.signedOutAllDevices
                    ? "Signed Out"
                    : "Sign Out All Devices"}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      {profileMessage && (
        <p className="profile-status-message">{profileMessage}</p>
      )}
      {profileData.academicIdentity.verificationStatus ===
      "email_verification_required" ? (
        <div className="profile-action-bar" role="group" aria-label="Verify institutional email">
          <label className="profile-field">
            <span>Institutional email verification code</span>
            <input
              value={institutionalEmailCode}
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => setInstitutionalEmailCode(event.target.value.replace(/\D/g, ""))}
              placeholder="6-digit code"
            />
          </label>
          <button type="button" className="profile-save" onClick={verifyInstitutionalEmail}>
            Verify email
          </button>
        </div>
      ) : null}
      <div className="profile-action-bar">
        <button
          type="button"
          className="profile-cancel"
          onClick={cancelProfileChanges}
        >
          Cancel
        </button>
        <button
          type="button"
          className="profile-save"
          onClick={saveProfileChanges}
        >
          <MiniIcon path="M5 5h14v14H5zM8 5v5h8V5M8 19v-5h8v5" />
          {activeTab === "Role Change Request"
            ? "Submit Role Change"
            : "Save Changes"}
        </button>
      </div>
    </div>
  );

  if (isAcademic) {
    return (
      <ResearcherShell
        activeRoute={getAcademicPath("/researcher-profile", academicRole)}
        current="Profile"
        pageClassName="profile-page researcher-profile-page"
        mainClassName="researcher-profile-main"
        profileAvatarUrl={profileData.personal.avatarUrl}
      >
        {pageContent}
      </ResearcherShell>
    );
  }

  return (
    <main className="student-app profile-page">
      <StudentSidebar activeRoute="/student-profile" />
      <section className="student-main">
        <StudentTopbar
          crumb={
            <div className="topbar-breadcrumb">
              Dashboard <span>&gt;</span> <strong>Profile</strong>
            </div>
          }
          variant="profile"
          searchPlaceholder="Search ScholarTrend..."
        />
        {pageContent}
      </section>
    </main>
  );
}

export { ProfileTabs, ProfileField, ProfilePage };
