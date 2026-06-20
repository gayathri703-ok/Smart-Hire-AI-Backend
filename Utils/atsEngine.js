/**
 * SmartHire AI — ATS Matching Engine
 * Score = Skill(50%) + Keyword(30%) + Experience(20%)
 */

const TECH_SKILLS = [
  'javascript','typescript','python','java','golang','go','rust','c++','c#','ruby','php','swift','kotlin',
  'react','angular','vue','next.js','nuxt','svelte','react native','flutter',
  'node.js','express','fastapi','django','flask','spring','laravel','rails',
  'mongodb','postgresql','mysql','sqlite','redis','elasticsearch','cassandra','dynamodb','firebase',
  'docker','kubernetes','terraform','ansible','jenkins','github actions','ci/cd','helm',
  'aws','gcp','azure','cloudflare','vercel','netlify','heroku',
  'graphql','rest','restful','grpc','websocket','microservices','kafka',
  'git','linux','bash','nginx','webpack','vite',
  'machine learning','deep learning','tensorflow','pytorch','scikit-learn','nlp',
  'html','css','sass','tailwind','bootstrap','figma',
  'agile','scrum','jira','devops','jest','cypress','selenium','tdd'
];

const STOP_WORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with','is','are','was','were',
  'be','been','has','have','had','will','would','can','could','should','may','might','must',
  'this','that','these','those','we','you','they','our','your','their','it','its','as','by',
  'from','about','into','not','no','more','also','than','then','so','if','do','does','did',
  'get','use','work','experience','years','strong','good','skills','knowledge','team','company'
]);

function normalise(text) {
  return (text || '').toLowerCase().replace(/[^a-z0-9\s.+#]/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractWords(text) {
  return normalise(text).split(' ').filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

function extractSkills(text) {
  const lower = normalise(text);
  return TECH_SKILLS.filter(skill => {
    const re = new RegExp(`(?<![a-z0-9])${skill.replace(/[.+#]/g, '\\$&')}(?![a-z0-9])`, 'i');
    return re.test(lower);
  });
}

function extractExperienceYears(text) {
  const patterns = [
    /(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/i,
    /experience[:\s]+(\d+)\+?\s*years?/i,
    /(\d{4})\s*[-–]\s*(present|current|now)/i
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      if (m[0].match(/\d{4}/)) return new Date().getFullYear() - parseInt(m[1]);
      return parseInt(m[1]);
    }
  }
  return 0;
}

function extractRequiredYears(jd) {
  const patterns = [
    /(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/i,
    /minimum\s+(\d+)\s*years?/i,
    /at\s+least\s+(\d+)\s*years?/i
  ];
  for (const p of patterns) {
    const m = jd.match(p);
    if (m) return parseInt(m[1]);
  }
  return 0;
}

function analyseMatch(resumeText, jdText, requiredSkills = []) {
  if (!resumeText || !jdText)
    return { atsScore:0, skillMatchScore:0, keywordMatchScore:0, experienceScore:0, matchedSkills:[], missingSkills:[], suggestions:['Resume or JD is empty.'] };

  const resumeSkills = extractSkills(resumeText);
  const jdSkills     = extractSkills(jdText);
  const allRequired  = [...new Set([...jdSkills, ...requiredSkills.map(s => normalise(s))])];
  const matchedSkills = allRequired.filter(s => resumeSkills.includes(s));
  const missingSkills = allRequired.filter(s => !resumeSkills.includes(s));
  const skillMatchScore = allRequired.length > 0 ? Math.round((matchedSkills.length / allRequired.length) * 100) : 60;

  const resumeWordSet = new Set(extractWords(resumeText));
  const jdWords       = [...new Set(extractWords(jdText))].filter(w => w.length > 3);
  const matchedKw     = jdWords.filter(w => resumeWordSet.has(w));
  const keywordMatchScore = jdWords.length > 0 ? Math.round((matchedKw.length / jdWords.length) * 100) : 60;

  const resumeYears   = extractExperienceYears(resumeText);
  const requiredYears = extractRequiredYears(jdText);
  let experienceScore = 70;
  if (requiredYears > 0) {
    if (resumeYears >= requiredYears) experienceScore = 100;
    else if (resumeYears === 0)       experienceScore = 30;
    else experienceScore = Math.round((resumeYears / requiredYears) * 100);
  }

  const atsScore = Math.min(100, Math.max(0, Math.round(
    skillMatchScore * 0.50 + keywordMatchScore * 0.30 + experienceScore * 0.20
  )));

  const suggestions = [];
  if (missingSkills.length > 0)
    suggestions.push(`Add missing skills: ${missingSkills.slice(0,5).join(', ')}.`);
  if (skillMatchScore < 50)
    suggestions.push('Skill match is low. Mirror exact skill keywords from the job description.');
  else if (skillMatchScore < 75)
    suggestions.push('Highlight your most relevant skills at the top of your skills section.');
  if (keywordMatchScore < 50)
    suggestions.push('Low keyword overlap. Use the same terminology as the JD — ATS does literal matching.');
  if (requiredYears > 0 && resumeYears > 0 && resumeYears < requiredYears)
    suggestions.push(`Job requires ${requiredYears} years; your resume shows ~${resumeYears}. Emphasise impact to compensate.`);
  if (!/\d+%|\d+x|\$\d+|\d+\s*(users|clients|engineers|team)/i.test(resumeText))
    suggestions.push('Add measurable achievements (e.g. "Reduced load time by 40%", "Led team of 6").');
  const wc = resumeText.split(/\s+/).length;
  if (wc < 200) suggestions.push('Resume is too short. Add more detail about your experience.');
  else if (wc > 1200) suggestions.push('Resume may be too long. Keep it under 800 words if under 5 years experience.');
  if (skillMatchScore >= 80 && keywordMatchScore >= 70)
    suggestions.push('Excellent match! Apply with confidence.');
  if (suggestions.length === 0)
    suggestions.push('Good match. Submit your application and follow up within a week.');

  return {
    atsScore, skillMatchScore: Math.min(100,skillMatchScore),
    keywordMatchScore: Math.min(100,keywordMatchScore),
    experienceScore:   Math.min(100,experienceScore),
    matchedSkills, missingSkills: missingSkills.slice(0,15), suggestions,
    meta: { resumeYears, requiredYears }
  };
}

module.exports = { analyseMatch, extractSkills, extractExperienceYears, extractWords };