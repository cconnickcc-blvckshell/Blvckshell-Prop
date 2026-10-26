import { getBusinessPhoneDisplay, getVerifiedBusinessPhoneE164 } from "@/lib/business-phone";

type PhoneContactProps = {
  className?: string;
  linkClassName?: string;
};

/** Renders dialable tel: link when E.164 is configured (env or marketing-site default). */
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

  return <span className={className}>{display}</span>;
}
