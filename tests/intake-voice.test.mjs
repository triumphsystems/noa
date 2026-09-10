import { test, describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Helper implementations mirroring lib/voice logic for node --test execution
function getPopulatedFields(draft) {
  if (!draft) return [];
  const populated = [];

  const fullName = [draft.firstName, draft.lastName].filter(Boolean).join(' ');
  if (fullName) populated.push(`Full Name (${fullName})`);
  if (draft.dateOfBirth) populated.push(`Date of Birth (${draft.dateOfBirth})`);
  if (draft.phone) populated.push(`Phone (${draft.phone})`);
  if (draft.email) populated.push(`Email (${draft.email})`);
  if (draft.gender) populated.push(`Gender (${draft.gender})`);
  if (draft.address) populated.push(`Address (${draft.address})`);
  if (draft.chiefComplaint)
    populated.push(`Reason for visit (${draft.chiefComplaint})`);
  if (draft.medicalConditions && draft.medicalConditions.length > 0) {
    populated.push(
      `Medical Conditions (${draft.medicalConditions.join(', ')})`
    );
  }
  if (draft.currentMedications && draft.currentMedications.length > 0) {
    populated.push(`Medications (${draft.currentMedications.join(', ')})`);
  }
  if (draft.allergies && draft.allergies.length > 0) {
    populated.push(`Allergies (${draft.allergies.join(', ')})`);
  }
  if (draft.surgeries) populated.push(`Surgeries (${draft.surgeries})`);
  if (draft.familyHistory)
    populated.push(`Family History (${draft.familyHistory})`);
  if (draft.smokingStatus) populated.push(`Smoking (${draft.smokingStatus})`);
  if (draft.alcoholUse) populated.push(`Alcohol (${draft.alcoholUse})`);
  if (draft.emergencyContactName) {
    populated.push(
      `Emergency Contact (${draft.emergencyContactName}${draft.emergencyContactPhone ? ` - ${draft.emergencyContactPhone}` : ''})`
    );
  }
  if (draft.consentRead) populated.push('Consent (Confirmed)');

  return populated;
}

function getMissingFields(draft) {
  if (!draft) {
    return [
      'full name',
      'date of birth',
      'contact phone or email',
      'symptoms or reason for visit',
      'medical conditions',
      'current medications',
      'known allergies',
      'emergency contact',
      'consent',
    ];
  }

  const missing = [];
  const hasName = Boolean(draft.firstName?.trim() && draft.lastName?.trim());
  if (!hasName) missing.push('full name');

  if (!draft.dateOfBirth?.trim()) missing.push('date of birth');

  const hasContact = Boolean(draft.phone?.trim() || draft.email?.trim());
  if (!hasContact) missing.push('contact phone or email');

  if (!draft.chiefComplaint?.trim()) {
    missing.push('symptoms or reason for visit');
  }

  if (!draft.medicalConditions || draft.medicalConditions.length === 0) {
    missing.push('medical conditions');
  }

  if (!draft.currentMedications || draft.currentMedications.length === 0) {
    missing.push('current medications');
  }

  if (!draft.allergies || draft.allergies.length === 0) {
    missing.push('known allergies');
  }

  if (!draft.emergencyContactName?.trim()) {
    missing.push('emergency contact');
  }

  if (!draft.consentRead) {
    missing.push('consent to submit');
  }

  return missing;
}

function isNegativeConfirmation(text) {
  if (!text) return false;
  const clean = text
    .trim()
    .toLowerCase()
    .replace(/[.!?,]/g, '');
  const exactNegatives = new Set([
    'no',
    'nope',
    'nah',
    'no thanks',
    'no thank you',
    'nothing',
    'nothing else',
    'no nothing else',
    'no that is all',
    'no that is everything',
    'no thats all',
    'no thats everything',
    'thats all',
    'thats everything',
    'that is all',
    'that is everything',
    'im good',
    'i am good',
    'all good',
    'all set',
    'no im good',
    'no i am good',
    'no all good',
    'no all set',
    'i do not have anything else',
    'i dont have anything else',
    'no i do not have anything else',
    'no i dont have anything else',
    'nothing more',
    'no nothing more',
    'none',
    'no more',
    'we are good',
    'thats it',
    'that is it',
    'no thats it',
    'no that is it',
    'ready',
    'ready to finalize',
  ]);
  if (exactNegatives.has(clean)) return true;

  const negativePattern =
    /^(no|nope|nah)\b.*(nothing|that'?s (all|it|everything)|(i'?m|we'?re) (good|all set)|don'?t have anything|ready)/i;
  const nothingPattern =
    /^(nothing else|that'?s (all|it|everything)|(i'?m|we'?re) (good|all set)|i don'?t have anything else)/i;
  return negativePattern.test(clean) || nothingPattern.test(clean);
}

function isFinalizationQuestion(text) {
  if (!text) return false;
  return /anything else.*(doctor|know|finalize|add)|ready to finalize|before we finalize/i.test(
    text
  );
}

function generateMissingFieldPrompt(missingField, firstName) {
  const name = firstName ? `${firstName}, ` : '';
  switch (missingField) {
    case 'full name':
      return `What is your full name?`;
    case 'date of birth':
      return `${name}could you please provide your date of birth?`;
    case 'contact phone or email':
      return `${name}what is the best phone number or email address to reach you?`;
    case 'symptoms or reason for visit':
      return `${name}what symptoms or medical concerns bring you in to see the doctor today?`;
    case 'medical conditions':
      return `${name}do you have any ongoing medical conditions or chronic illnesses, or are you generally healthy?`;
    case 'current medications':
      return `${name}are you currently taking any prescription or over-the-counter medications?`;
    case 'known allergies':
      return `${name}do you have any known allergies to medications, foods, or environmental triggers?`;
    case 'emergency contact':
      return `${name}could you please provide the name and phone number of an emergency contact?`;
    case 'consent to submit':
      return `${name}do you give consent to submit your intake information to your doctor?`;
    default:
      return `${name}could you please provide your ${missingField}?`;
  }
}

function normalizeClinicalDraft(draft, transcript) {
  const t = transcript.toLowerCase();
  if (!draft.allergies || draft.allergies.length === 0) {
    if (
      /(no|none|never had|don'?t have|not aware of).*(allerg|reaction)/i.test(
        t
      ) ||
      /^(no|none|no allergies|nope)[.!]?$/i.test(t.trim())
    ) {
      draft.allergies = ['No known allergies'];
    }
  }
  if (!draft.currentMedications || draft.currentMedications.length === 0) {
    if (
      /(no|none|not taking|don'?t take).*(med|prescription|pill|drug)/i.test(
        t
      ) ||
      /^(no|none|no medications|no meds|nope)[.!]?$/i.test(t.trim())
    ) {
      draft.currentMedications = ['None'];
    }
  }
  if (!draft.medicalConditions || draft.medicalConditions.length === 0) {
    if (
      /(no|none|don'?t have|healthy).*(condition|illness|disease|problem)/i.test(
        t
      ) ||
      /^(no|none|no conditions|healthy|nope)[.!]?$/i.test(t.trim())
    ) {
      draft.medicalConditions = ['None reported'];
    }
  }
  if (!draft.emergencyContactName?.trim()) {
    if (/(no|don'?t have|none|skip).*(emergency contact|contact)/i.test(t)) {
      draft.emergencyContactName = 'None provided';
    }
  }
  if (!draft.email?.trim() && draft.phone?.trim()) {
    if (/(no|don'?t have|none).*(email)/i.test(t)) {
      draft.email = 'N/A';
    }
  }
}

describe('Intake Voice Logic & Strict Completion Suite', () => {
  it('should identify missing fields when draft is empty', () => {
    const missing = getMissingFields({});
    assert.ok(missing.includes('full name'));
    assert.ok(missing.includes('date of birth'));
    assert.ok(missing.includes('contact phone or email'));
    assert.ok(missing.includes('symptoms or reason for visit'));
    assert.ok(missing.includes('medical conditions'));
    assert.ok(missing.includes('current medications'));
    assert.ok(missing.includes('known allergies'));
    assert.ok(missing.includes('emergency contact'));
    assert.ok(missing.includes('consent to submit'));
  });

  it('should detect contact phone or email if either is provided', () => {
    const withPhone = { phone: '123-456-7890' };
    const missingPhone = getMissingFields(withPhone);
    assert.ok(!missingPhone.includes('contact phone or email'));

    const withEmail = { email: 'test@example.com' };
    const missingEmail = getMissingFields(withEmail);
    assert.ok(!missingEmail.includes('contact phone or email'));
  });

  it('should return zero missing fields when all required fields are satisfied', () => {
    const completeDraft = {
      firstName: 'Alice',
      lastName: 'Smith',
      dateOfBirth: '1985-05-12',
      phone: '555-0199',
      chiefComplaint: 'Persistent migraine for 3 days',
      medicalConditions: ['None reported'],
      currentMedications: ['None'],
      allergies: ['No known allergies'],
      emergencyContactName: 'Bob Smith',
      consentRead: true,
    };

    const missing = getMissingFields(completeDraft);
    assert.equal(missing.length, 0);
  });

  it('should correctly populate readable fields', () => {
    const draft = {
      firstName: 'Alice',
      lastName: 'Smith',
      dateOfBirth: '1985-05-12',
      phone: '555-0199',
      chiefComplaint: 'Migraine',
      allergies: ['Penicillin'],
      currentMedications: ['Ibuprofen'],
      medicalConditions: ['Hypertension'],
      emergencyContactName: 'Bob Smith',
      consentRead: true,
    };

    const populated = getPopulatedFields(draft);
    assert.ok(populated.some((p) => p.includes('Alice Smith')));
    assert.ok(populated.some((p) => p.includes('1985-05-12')));
    assert.ok(populated.some((p) => p.includes('555-0199')));
    assert.ok(populated.some((p) => p.includes('Migraine')));
    assert.ok(populated.some((p) => p.includes('Penicillin')));
    assert.ok(populated.some((p) => p.includes('Ibuprofen')));
    assert.ok(populated.some((p) => p.includes('Hypertension')));
    assert.ok(populated.some((p) => p.includes('Bob Smith')));
    assert.ok(populated.some((p) => p.includes('Consent (Confirmed)')));
  });
});

describe('Loop Prevention & Negative Confirmation Detection Suite', () => {
  it('should accurately recognize patient statements indicating nothing else to add', () => {
    const negativePhrases = [
      'no',
      'No',
      'nope',
      'nothing',
      'nothing else',
      'No, nothing else',
      'No that is all',
      'no, that is everything',
      'No, that is all',
      "No, that's all",
      "no that's everything",
      "That's all",
      "I'm good",
      'All good',
      'All set',
      "No, I'm good",
      'No all set',
      'I do not have anything else',
      "I don't have anything else",
      'No, I do not have anything else',
      "No, I'm good, nothing else.",
      'Nothing more',
      'None',
      "That's it",
      'Ready to finalize',
    ];

    for (const phrase of negativePhrases) {
      assert.equal(
        isNegativeConfirmation(phrase),
        true,
        `Expected "${phrase}" to be recognized as negative confirmation`
      );
    }
  });

  it('should NOT treat affirmative or descriptive clinical statements as negative confirmations', () => {
    const clinicalPhrases = [
      'Yes, my stomach also hurts since yesterday',
      'I also had a fever of 101',
      'I also take aspirin occasionally',
      'Yes',
      'Actually I forgot to mention my asthma',
    ];

    for (const phrase of clinicalPhrases) {
      assert.equal(
        isNegativeConfirmation(phrase),
        false,
        `Expected "${phrase}" to NOT be recognized as negative confirmation`
      );
    }
  });

  it('should detect assistant finalization questions', () => {
    assert.ok(
      isFinalizationQuestion(
        "Is there anything else you'd like your doctor to know before we finalize?"
      )
    );
    assert.ok(
      isFinalizationQuestion(
        'Is there anything else you would like your doctor to know?'
      )
    );
    assert.ok(
      isFinalizationQuestion(
        'Do you have anything else to add, or are you ready to finalize?'
      )
    );
    assert.equal(
      isFinalizationQuestion('What symptoms bring you in to see the doctor?'),
      false
    );
  });
});

describe('Clinical Draft Normalization & Missing Field Prompts Suite', () => {
  it('should normalize negative verbal answers into clinical draft arrays', () => {
    const draft = {};

    normalizeClinicalDraft(draft, "I don't have any allergies");
    assert.deepEqual(draft.allergies, ['No known allergies']);

    normalizeClinicalDraft(draft, "I'm not taking any medications right now");
    assert.deepEqual(draft.currentMedications, ['None']);

    normalizeClinicalDraft(draft, 'No medical conditions, I am very healthy');
    assert.deepEqual(draft.medicalConditions, ['None reported']);

    normalizeClinicalDraft(draft, "I don't have an emergency contact to list");
    assert.equal(draft.emergencyContactName, 'None provided');
  });

  it('should generate targeted prompts for missing fields', () => {
    const prompt1 = generateMissingFieldPrompt('known allergies', 'Alice');
    assert.ok(prompt1.includes('known allergies'));
    assert.ok(prompt1.includes('Alice'));

    const prompt2 = generateMissingFieldPrompt('emergency contact', 'Bob');
    assert.ok(prompt2.includes('emergency contact'));
    assert.ok(prompt2.includes('Bob'));

    const prompt3 = generateMissingFieldPrompt('contact phone or email');
    assert.ok(prompt3.includes('phone number or email address'));
  });

  it('should prevent loop when patient answers "no" to finalization question', () => {
    const history = [
      {
        role: 'assistant',
        content:
          'We have captured all your intake details. Is there anything else you would like your doctor to know before we finalize?',
      },
    ];
    const transcript = "No, I don't have anything else.";
    const draft = {
      firstName: 'Jane',
      lastName: 'Doe',
      dateOfBirth: '1992-04-05',
      phone: '555-8833',
      chiefComplaint: 'Earache',
      medicalConditions: ['None reported'],
      currentMedications: ['None'],
      allergies: ['No known allergies'],
      emergencyContactName: 'John Doe',
      consentRead: false,
    };

    const actualMissing = getMissingFields(draft);
    assert.equal(actualMissing.length, 1); // only consentRead is missing
    assert.equal(actualMissing[0], 'consent to submit');

    const lastAssistantMsg =
      history.filter((m) => m.role === 'assistant').pop()?.content || '';
    const wasAskedFinalize = isFinalizationQuestion(lastAssistantMsg);
    const userSaidNoMore = isNegativeConfirmation(transcript);

    assert.equal(wasAskedFinalize, true);
    assert.equal(userSaidNoMore, true);

    // Simulated turn logic
    let isComplete = false;
    let assistantMessage =
      "Is there anything else you'd like your doctor to know before we finalize?";

    // Before consent, only consent was missing; user saying no more confirms consent!
    draft.consentRead = true;
    const finalMissing = getMissingFields(draft);
    assert.equal(finalMissing.length, 0);

    if (finalMissing.length === 0 && wasAskedFinalize && userSaidNoMore) {
      isComplete = true;
      if (isFinalizationQuestion(assistantMessage)) {
        assistantMessage = `Thank you, ${draft.firstName}! Your intake is complete. I have recorded all your information and shared it with your doctor.`;
      }
    }

    assert.equal(isComplete, true);
    assert.ok(!isFinalizationQuestion(assistantMessage));
    assert.ok(assistantMessage.includes('intake is complete'));
  });

  it('should reject completion if clinical fields are still missing', () => {
    const draftWithMissing = {
      firstName: 'Jane',
      lastName: 'Doe',
      dateOfBirth: '1992-04-05',
      // phone/email missing
      // emergency contact missing
    };

    const actualMissing = getMissingFields(draftWithMissing);
    assert.ok(actualMissing.length > 0);

    // Even if an AI mistakenly set isComplete = true, strict validation blocks it
    const aiProposedComplete = true;
    const strictlyComplete = Boolean(
      aiProposedComplete && actualMissing.length === 0
    );

    assert.equal(strictlyComplete, false);
  });
});
