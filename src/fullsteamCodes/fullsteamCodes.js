export const responseCodes = [{
    code: -999,
    response: "Unknown – an unknown error has occurred"
  },
  {
    code: 1,
    response: "System Error – processing of transaction failed. Please try again.",
  },
  {
    code: 10,
    response: "Validation Error – the request did not pass validation and could not be processed.",
  },
  {
    code: 20,
    response: "Transaction Not Found – the transaction referenced by the request was not found",
  },
  {
    code: 21,
    response: "Resource Not Found – the resource referenced by the request was not found",
  },
  {
    code: 22,
    response: "Duplicate RequestId – the RequestId provided in the request has already been used for the merchant.",
  },
  {
    code: 150,
    response: "Reversal Options Not Available – the reversal option requested cannot be performed on the transaction provided",
  },
  {
    code: 300,
    response: "Configuration Error – there is a configuration error within the FullsteamPay system. Please contact Fullsteam.",
  },
  {
    code: 400,
    response: "Communication Error – there has been a communication error with an external resource that caused the processing of the request to fail. Please try again.",
  },
  {
    code: 999,
    response: "Authentication Failure – the credentials provided are invalid or user does not have permission for action requested.",
  },
  {
    code: 1007,
    response: "ProcessorDCCRequested – Fullsteam received a DCC Requested response from the processor. The transaction is being attempted in a different currency than the card holder card supports by default.",
  },
  {
    code: 1020,
    response: "Card issuer has declined the transaction due to unspecified reason. Please contact card issuer for more information.",
  },
  {
    code: 1021,
    response: "Expired Card – the card issuer has declined the transaction because the card is expired, or the expiration date provided is invalid.",
  },
  {
    code: 1023,
    response: "Processor Duplicate – Fullsteam received a Duplicate response from the processor.  This means the processor has determined the transaction is a duplicate by their rules and the API request to Fullsteam did not disable duplicate detection. Currently, the processor defines a duplicate as a transaction for the same amount on the same card for the same merchant within the same batch within 25 transactions of the matching transaction.",
  },
  {
    code: 1024,
    response: "Card issuer has declined the transaction, card no longer valid.",
  },
  {
    code: 1025,
    response: "Processor Referral Call Issuer – Fullsteam received a Call Issuer response from the processor.  This means the card issuer has requested that the card holder call the card issuer to discuss the transaction and to verbally authorize the approval of the transaction.",
  },
  {
    code: 1030,
    response: "Processor Balance Not Available – Fullsteam received a Balance Not Available response the processor.  This means the card issuer has declined the transaction because the balance is not available on the card account to support the transaction.",
  },
  {
    code: 1090,
    response: "Processor Undefined Decline or Error – Fullsteam received an Undefined Decline or Error response from the processor.  This means the card issuer has declined the transaction for an undefined reason or some error occurred during the card issuers processing of the transaction.",
  },
  {
    code: 1101,
    response: "Invalid Data – Information provided is invalid, please correct all information inputted and try again.",
  },
  {
    code: 1102,
    response: "Processor Invalid Account – Fullsteam received an Invalid Account response from the processor.  This means something is incorrect about the merchant configuration at Fullsteam or at the processor.  Please contact Fullsteam.",
  },
  {
    code: 1103,
    response: "Invalid Request – Please carefully resubmit all information inputted and try again.",
  },
  {
    code: 1105,
    response: 'Card number or card type submitted is invalid.'
  },  
  {
    code: 1120,
    response: "Processor Out of Balance – Fullsteam received an Out of Balance response from the processor.  This should not occur because this error only occurs on merchant-initiated batch closes which are not currently supported.",
  },
  {
    code: 2001,
    response: "Processor Communication Error – the processor experienced an error trying to communicate with the card issuer and the transaction request cannot be processed. This transaction has been voided. Please try again.",
  },
  {
    code: 2002,
    response: "Processor Host Error – Fullsteam received a Host Error from the processor. This means the card issuer experienced an error trying to process the transaction request. It is possible that the card holder will see an open authorization if they view their card statement online after this error. However, the transaction has been voided and will not settle.",
  },
  {
    code: 2009,
    response: "Processor Error – Fullsteam received an Error response from the Processor. This means the processor or the card issuer experienced an error attempting to process the request and the transaction request was not processed.",
  },
  {
    code: 2999,
    response: 'Processor Unknown Response – Fullsteam received an unknown response from the processor.'
  },
  {
    code: 3101,
    response: "Signature Cancelled by User – the customer cancelled a contract signature process on the cloud terminal",
  },
  {
    code: 3102,
    response: "Signature Not Supported by Terminal – the terminal Id provided is not a terminal model that supports contract signature capture",
  },
  {
    code: 3103,
    response: "Signature Terminal Error – an error occurred on the terminal when attempting a contract signature capture",
  },
  {
    code: 3199,
    response: "Signature Unknown Error – an unknown error occurred when attempting a contract signature capture",
  },
];

export const AVS_response_codes = [{
    code: "A",
    response: "Zip code does not match billing records"
  },
  {
    code: "B",
    response: "Incompatible Postal Code Format",
  },
  {
    code: "C",
    response: "Incompatible street address and postal code format",
  },
  {
    code: "D",
    response: "Street address and postal code match"
  },
  {
    code: "E",
    response: "Edit error",
  },
  {
    code: "F",
    response: "International Transaction: Street address and postal code match",
  },
  {
    code: "G",
    response: "Global participant, non-US Issuer does not participate in address service verification"
  },
  {
    code: "I",
    response: "International Transaction - Address information not verified for international transaction",
  },
  {
    code: "J",
    response: "American Express only. Card Member information and Ship-To Information Verified – Fraud Protection Program",
  },
  {
    code: "K",
    response: "American Express only.  Card Member information and Ship-To Information Verified – Standard",
  },
  {
    code: "M",
    response: "Match: Street address and postal code match"
  },
  {
    code: "N",
    response: "Address and zip code do not match billing records"
  },
  {
    code: "P",
    response: "Incompatible Street Address format",
  },
  {
    code: "R",
    response: "System unavailable or timed out, please resubmit your purchase"
  },
  {
    code: "S",
    response: "Service not supported - issuer does not support address verification service",
  },
  {
    code: "T",
    response: "Address does not match billing records",
  },
  {
    code: "U",
    response: "Address information is not available for the customer's credit card",
  },
  {
    code: "W",
    response: "Address does not match billing records.  For Discover Cards, no data was provided",
  },
  {
    code: "X",
    response: "Exact: Address and nine-digit zip code match"
  },
  {
    code: "Y",
    response: "Yes: Address and five-digit zip code match"
  },
  {
    code: "Z",
    response: "Address does not match billing information",
  },
  {
    code: "0",
    response: "No address verification has been requested"
  },
];

export const CVV_response_codes = [{
    code: "M",
    response: "Match"
  },
  {
    code: "N",
    response: "Incorrect CVV (Security Code)"
  },
  {
    code: "P",
    response: "Not Processed"
  },
  {
    code: "S",
    response: "CVV value should be on the card, but the merchant has indicated that it is not present",
  },
  {
    code: "U",
    response: "Issuer is not certified for CVV processing",
  },
  {
    code: "X",
    response: "Service provider did not respond",
  },
];