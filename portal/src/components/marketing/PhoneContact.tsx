import { getBusinessPhoneDisplay, getVerifiedBusinessPhoneE164 } from "@/lib/business-phone";

type PhoneContactProps = {
  className?: string;
  linkClassName?: string;
};

/** Renders verified tel: link when BUSINESS_PHONE_E164 is set; otherwise display-only text. */
export default function PhoneContact({ className = "", linkClassName = "" }: PhoneContactProps) {
  const display = getBusinessPhoneDisplay();
  const tel = getVerifiedBusinessPhoneE164();

  if (tel) {
    return (
      <a href={`tel:${tel}`} className={linkClassName || className}>
        {display}
      </a>
    );
  }

  return (
    <span className={className} title="Business phone pending owner verification">
      {display}
    </span>
  );
}
