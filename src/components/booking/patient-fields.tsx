"use client";

import { useState } from "react";
import type { ComponentPropsWithoutRef, ElementType, FocusEvent } from "react";
import {
  acceptAttribute,
  bookingCopy,
  checkboxClass,
  checkboxRowClass,
  consentRowClass,
  COVERAGE_OPTIONS,
  coverageCardClass,
  Field,
  fieldCopy,
  fileInputClass,
  groupTitleClass,
  inputClass,
  uploadHint,
} from "@/components/booking/field";
import type { DocumentKind } from "@/lib/booking/records";
import {
  emailError,
  HMO_PROVIDERS,
  NAME_SUFFIXES,
  normalizePhMobile,
  phoneError,
  type AppointmentField,
  type CoverageType,
} from "@/lib/booking/schema";

type InputBind = ComponentPropsWithoutRef<"input">;
type SelectBind = ComponentPropsWithoutRef<"select">;

/**
 * Identity, contact, coverage, and consent — the same markup for the home
 * wizard and /book, so a copy or validation change cannot land in only one.
 */
export function PatientVerificationFields({
  Title = "h2",
  idFor,
  errors,
  documentErrors = {},
  coverageType,
  noMiddleName,
  firstName,
  surname,
  middleName,
  suffix,
  phone,
  email,
  coverageTypeBind,
  hmoProvider,
  hmoMemberId,
  noMiddleNameBind,
  privacyConsent,
  isNewPatient,
}: {
  Title?: ElementType;
  idFor: (field: string) => string;
  errors: Partial<Record<AppointmentField, string>>;
  documentErrors?: Partial<Record<DocumentKind, string>>;
  coverageType: CoverageType;
  noMiddleName: boolean;
  firstName: InputBind;
  surname: InputBind;
  middleName: InputBind;
  suffix: SelectBind;
  phone: InputBind;
  email: InputBind;
  coverageTypeBind: InputBind;
  hmoProvider: SelectBind;
  hmoMemberId: InputBind;
  noMiddleNameBind: InputBind;
  privacyConsent: InputBind;
  isNewPatient: InputBind;
}) {
  const [localPhoneError, setLocalPhoneError] = useState<string>();
  const [localEmailError, setLocalEmailError] = useState<string>();
  const phoneMessage = errors.phone ?? localPhoneError;
  const emailMessage = errors.email ?? localEmailError;

  const {
    onBlur: phoneOnBlur,
    onChange: phoneOnChange,
    ...phoneRest
  } = phone;
  const {
    onBlur: emailOnBlur,
    onChange: emailOnChange,
    ...emailRest
  } = email;

  const handlePhoneBlur = (event: FocusEvent<HTMLInputElement>) => {
    event.currentTarget.value = normalizePhMobile(event.currentTarget.value);
    phoneOnChange?.(event);
    setLocalPhoneError(phoneError(event.currentTarget.value));
    phoneOnBlur?.(event);
  };

  const handleEmailBlur = (event: FocusEvent<HTMLInputElement>) => {
    event.currentTarget.value = event.currentTarget.value.trim();
    emailOnChange?.(event);
    setLocalEmailError(emailError(event.currentTarget.value));
    emailOnBlur?.(event);
  };

  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <Title className={groupTitleClass}>{bookingCopy.identityGroup}</Title>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label={fieldCopy.firstName.label}
            htmlFor={idFor("firstName")}
            error={errors.firstName}
          >
            <input
              id={idFor("firstName")}
              type="text"
              autoComplete="given-name"
              autoCapitalize="words"
              aria-invalid={Boolean(errors.firstName)}
              aria-describedby={
                errors.firstName ? `${idFor("firstName")}-error` : undefined
              }
              className={inputClass}
              {...firstName}
            />
          </Field>
          <Field
            label={fieldCopy.surname.label}
            htmlFor={idFor("surname")}
            error={errors.surname}
          >
            <input
              id={idFor("surname")}
              type="text"
              autoComplete="family-name"
              autoCapitalize="words"
              aria-invalid={Boolean(errors.surname)}
              aria-describedby={
                errors.surname ? `${idFor("surname")}-error` : undefined
              }
              className={inputClass}
              {...surname}
            />
          </Field>
        </div>

        <Field
          label={fieldCopy.middleName.label}
          htmlFor={idFor("middleName")}
          error={errors.middleName}
          optional={noMiddleName}
        >
          <input
            id={idFor("middleName")}
            type="text"
            autoComplete="additional-name"
            autoCapitalize="words"
            disabled={noMiddleName}
            aria-invalid={Boolean(errors.middleName)}
            aria-describedby={
              errors.middleName ? `${idFor("middleName")}-error` : undefined
            }
            className={`${inputClass} disabled:bg-sand/60 disabled:text-muted`}
            {...middleName}
          />
        </Field>
        <label className={checkboxRowClass}>
          <input type="checkbox" className={checkboxClass} {...noMiddleNameBind} />
          {bookingCopy.noMiddleName}
        </label>

        <Field
          label={fieldCopy.suffix.label}
          htmlFor={idFor("suffix")}
          error={errors.suffix}
          optional
          className="sm:max-w-xs"
        >
          <select id={idFor("suffix")} className={inputClass} {...suffix}>
            <option value="">None</option>
            {NAME_SUFFIXES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </Field>
      </section>

      <section className="space-y-5">
        <Title className={groupTitleClass}>{bookingCopy.contactGroup}</Title>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label={fieldCopy.phone.label}
            htmlFor={idFor("phone")}
            error={phoneMessage}
            hint={fieldCopy.phone.hint}
          >
            <input
              id={idFor("phone")}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="09171234567"
              maxLength={16}
              aria-invalid={Boolean(phoneMessage)}
              aria-describedby={
                phoneMessage ? `${idFor("phone")}-error` : undefined
              }
              className={`${inputClass} tabular-nums`}
              {...phoneRest}
              onChange={(event) => {
                phoneOnChange?.(event);
                if (localPhoneError) {
                  setLocalPhoneError(phoneError(event.currentTarget.value));
                }
              }}
              onBlur={handlePhoneBlur}
            />
          </Field>
          <Field
            label={fieldCopy.email.label}
            htmlFor={idFor("email")}
            error={emailMessage}
            hint={fieldCopy.email.hint}
          >
            <input
              id={idFor("email")}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={80}
              aria-invalid={Boolean(emailMessage)}
              aria-describedby={
                emailMessage ? `${idFor("email")}-error` : undefined
              }
              className={inputClass}
              {...emailRest}
              onChange={(event) => {
                emailOnChange?.(event);
                if (localEmailError) {
                  setLocalEmailError(emailError(event.currentTarget.value));
                }
              }}
              onBlur={handleEmailBlur}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-5">
        <fieldset>
          <legend className={groupTitleClass}>
            {bookingCopy.coverageQuestion}
          </legend>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {COVERAGE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={coverageCardClass(coverageType === option.value)}
              >
                <input
                  type="radio"
                  className="sr-only"
                  {...coverageTypeBind}
                  value={option.value}
                />
                <span className="font-semibold text-ink">{option.label}</span>
              </label>
            ))}
          </div>
          {errors.coverageType ? (
            <p className="mt-2 text-xs text-teal-dark" role="alert">
              {errors.coverageType}
            </p>
          ) : null}
        </fieldset>

        {coverageType === "hmo" ? (
          <div className="space-y-5">
            <Field
              label={fieldCopy.hmoProvider.label}
              htmlFor={idFor("hmoProvider")}
              error={errors.hmoProvider}
            >
              <select
                id={idFor("hmoProvider")}
                aria-invalid={Boolean(errors.hmoProvider)}
                aria-describedby={
                  errors.hmoProvider
                    ? `${idFor("hmoProvider")}-error`
                    : undefined
                }
                className={inputClass}
                {...hmoProvider}
              >
                <option value="">Select provider</option>
                {HMO_PROVIDERS.map((provider) => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label={fieldCopy.hmoMemberId.label}
              htmlFor={idFor("hmoMemberId")}
              error={errors.hmoMemberId}
            >
              <input
                id={idFor("hmoMemberId")}
                type="text"
                autoCapitalize="characters"
                spellCheck={false}
                aria-invalid={Boolean(errors.hmoMemberId)}
                aria-describedby={
                  errors.hmoMemberId
                    ? `${idFor("hmoMemberId")}-error`
                    : undefined
                }
                className={`${inputClass} tabular-nums`}
                {...hmoMemberId}
              />
            </Field>
            <Field
              label={fieldCopy.hmoCardFront.label}
              htmlFor={idFor("hmoCardFront")}
              error={documentErrors.hmoCardFront}
              hint={uploadHint("hmoCardFront")}
            >
              <input
                id={idFor("hmoCardFront")}
                name="hmoCardFront"
                type="file"
                accept={acceptAttribute}
                aria-invalid={Boolean(documentErrors.hmoCardFront)}
                className={fileInputClass}
              />
            </Field>
            <Field
              label={fieldCopy.hmoCardBack.label}
              htmlFor={idFor("hmoCardBack")}
              error={documentErrors.hmoCardBack}
              hint={uploadHint("hmoCardBack")}
              optional
            >
              <input
                id={idFor("hmoCardBack")}
                name="hmoCardBack"
                type="file"
                accept={acceptAttribute}
                aria-invalid={Boolean(documentErrors.hmoCardBack)}
                className={fileInputClass}
              />
            </Field>
          </div>
        ) : (
          <Field
            label={fieldCopy.governmentId.label}
            htmlFor={idFor("governmentId")}
            error={documentErrors.governmentId}
            hint={uploadHint("governmentId")}
          >
            <input
              id={idFor("governmentId")}
              name="governmentId"
              type="file"
              accept={acceptAttribute}
              aria-invalid={Boolean(documentErrors.governmentId)}
              className={fileInputClass}
            />
          </Field>
        )}
      </section>

      <label className={consentRowClass}>
        <input
          type="checkbox"
          className={`mt-0.5 ${checkboxClass}`}
          {...privacyConsent}
        />
        <span>{bookingCopy.privacyConsent}</span>
      </label>
      {errors.privacyConsent ? (
        <p className="text-xs text-teal-dark" role="alert">
          {errors.privacyConsent}
        </p>
      ) : null}

      <label className={checkboxRowClass}>
        <input type="checkbox" className={checkboxClass} {...isNewPatient} />
        {bookingCopy.newPatient}
      </label>
    </div>
  );
}
