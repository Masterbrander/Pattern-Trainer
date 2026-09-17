# Calm Mode: research and design notes

Pattern Trainer V7 • Research checked September 17, 2026

## What this feature is, and is not

These are original, short, plain-language self-help scripts spoken by your device. They are not recordings from a therapist, licensed treatment protocols, diagnoses, or a substitute for treatment. The exact scripts, pacing, Random function, and app have not been clinically tested. Evidence for an ingredient does not establish that a new three-minute combination has the same effect. There is no guarantee that any exercise will reduce a particular episode.

The practical target is a little more choice before acting, not compulsory relaxation or immediate happiness. The scripts are written for adult self-use. They have not been validated specifically for ADHD or for children. Review suitability and wording with your therapist before treating them as part of a care plan or sharing them for clinical use.

## Why these four categories

### Bring me down: strongest fit to the anger target

Kjærvik and Bushman's 2024 meta-analysis included 154 studies and 10,189 participants. Arousal-decreasing activities reduced anger/aggression on average, whereas arousal-increasing activities were ineffective overall. This supports an approach that reduces tension rather than rehearsing grievances more intensely. It does not establish the effectiveness of these specific scripts. [1]

Fincham et al. pooled 12 randomized trials involving 785 adults for the stress outcome and found a small-to-medium average benefit of breathwork. Most studies had moderate risk of bias. The interventions, populations, and doses varied. [2] Balban et al. studied five minutes of daily breathwork over a month; that is not a test of a one-off anger episode. These scripts do not reproduce its cyclic-sighing protocol or claim the same results. [3]

Implementation: easy breathing, optional slightly longer exhalation, and releasing unnecessary muscle tension. One variant uses no breathing counts. No forced deep breaths, breath holds, rapid breathing, or cold-water challenges. NHS guidance emphasizes gentle, comfortable breathing. [4] A small trial of 20-minute relaxation recordings supports relaxation as a component, not the efficacy of our shorter release-only adaptation. [5]

### Ground me: clinically recommended, with a narrower direct evidence claim

WHO's stress-management guide is evidence-informed and field-tested, and includes grounding and unhooking skills. [6] NHS inform offers sensory grounding for overwhelming anxiety and stress. [7] These are useful guidance sources, not proof that a specific sensory checklist reliably stops anger. Our scripts use contact, sound, visual orientation, and present surroundings without requiring a rigid checklist. They are adaptations, not a validated 5-4-3-2-1 protocol.

Implementation: notice feet, support, texture, nearby sounds, or neutral objects. Eyes remain open for visual orientation. Other guides allow open or closed eyes where safe. If body-focused attention feels worse, the script offers external attention instead.

### Get me unstuck: experimental support for changing perspective

Two laboratory experiments by Mischkowski, Kross and Bushman found that a self-distanced perspective after provocation reduced angry/aggressive responses compared with self-immersion or controls. [8] This is relevant to angry thought loops, but the lab tasks are not the user's everyday life or these exact scripts. WHO's unhooking framework supplies an additional practical basis. [6]

Implementation: name the repeating thought briefly, distinguish noticing a thought from obeying it, take a neutral-observer or caring-adviser perspective, and select one controllable next action. The script does not decide whether the user is right, blame the user, demand forgiveness, or encourage extended replay of the provoking event.

### Make me laugh: an optional experiment, not an equally established treatment

Samson and Gross found that good-natured humor regulated responses to negative pictures more effectively than mean-spirited humor in two experiments. [9] That is indirect evidence for an acute anger episode. It does not prove that humorous audio, dark humor, or a particular joke will work. A spontaneous laugh that helped once is useful personal information, not a clinical validation study.

Implementation: harmless absurd scenarios involving a committee, announcer, documentary, or help desk. No targeting real people, shame, insults, or compulsory positivity. The scripts explicitly allow switching away when humor feels dismissive or aggravating. Random includes this category because the user requested it, not because the evidence is equal across all categories.

## Rant capture is separate from regulation

The anger meta-analysis does not support cathartic venting as an anger-management remedy. [1] Rant remains a way to capture words for later reflection. Calm does not claim that longer, louder, or more intense venting is therapeutic. If recording is increasing activation, stopping and taking space is an available choice.

## Safety and usability choices

Use only while stationary and away from driving, machinery, or other situations requiring full attention. No guide requires closing the eyes. Breathing is optional and comfortable; stop pacing and return to normal breathing if dizzy, breathless, or more distressed. Move away from immediate conflict when safe. If anyone is in immediate danger or the user cannot stay safe, the app is not the appropriate level of help.

Keep the app on screen. It asks for a screen wake lock where supported, but this is best-effort. Leaving the app pauses the guide. Pause cancels the current utterance; Resume repeats the current instruction rather than relying on inconsistent native pause handling. Stop cancels speech and pending pauses. Read instead makes progression manual. Audio failures show an error, not a false completion message.

The scripts are fixed and reviewable. Calm does not send the rant, private entries, or ratings to an LLM to generate speech. Voice synthesis uses the device/browser voice selected. Some voices need a network connection. Prefer a downloaded local English voice and test it in airplane mode; offline spoken output is not guaranteed.

## What is saved and what the numbers mean

A separate Calm record stores the guide/version ID, choice or Random, timestamps, completion status, optional before/after ratings and baseline source, and optional feedback. It does not create another anger incident. A started guide may be unfinished, switched, completed, or ended early. Stopping early is not automatically counted as success or failure.

Random starts without requiring a rating. A rating recalled afterward is labeled **recalled**. The displayed before-to-after average uses only valid ratings taken before and after completed or early-ended sessions. Unrated, recalled, switched, and interrupted pairs are excluded. The table is descriptive, not a ranking of treatments. A drop could reflect time passing, context, expectation, another action, or selection bias. No weighted-random personalization or AI training is implied.

Calm records are stored separately on the device, scoped to the signed-in account, queued for sync, and included in V7 backup exports. A new owner-protected Supabase table holds the cloud copy. Guest use plays the guides but does not retain a personal Calm record. Removing a Calm history row hides it through a synced deletion marker; it is not a promise of immediate removal from provider backups. Cloud sync is not a versioned disaster-recovery backup.

## Research sources

[1] Kjærvik & Bushman (2024), anger-management meta-analysis.
https://pubmed.ncbi.nlm.nih.gov/38518585/
154 studies; arousal-decreasing activities reduced anger/aggression overall. Supports lowering arousal, not a guarantee for these scripts or for an individual episode.

[2] Fincham et al. (2023), randomized breathwork trial meta-analysis.
https://pubmed.ncbi.nlm.nih.gov/36624160/
12 trials, 785 adults for stress; small-to-medium average effect, mostly moderate risk of bias. Programs and doses differ from these short guides.

[3] Balban et al. (2023), daily brief breathing randomized trial.
https://pubmed.ncbi.nlm.nih.gov/36630953/
Five minutes per day for one month; exhale-focused cyclic sighing improved positive affect and reduced respiratory rate relative to mindfulness. Not an anger-crisis trial, and these guides do not reproduce its protocol.

[4] NHS: breathing exercises for stress.
https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/
Clinical self-help guidance emphasizes comfortable, gentle breathing without force. Our counts are optional; no holds or rapid breathing.

[5] Toussaint et al. (2021), relaxation techniques randomized comparison.
https://pubmed.ncbi.nlm.nih.gov/34306146/
60 healthy undergraduates, 20-minute audio sessions. Supports relaxation training; the brief release-only scripts here are an adaptation, not the tested PMR protocol.

[6] WHO (2020): Doing What Matters in Times of Stress.
https://www.who.int/publications/i/item/9789240003927
Evidence-informed, field-tested stress self-help guidance including grounding and unhooking. Not proof that our short audio treats acute anger.

[7] NHS inform: grounding exercises.
https://www.nhsinform.scot/healthy-living/mental-wellbeing/breathing-and-relaxation-exercises/grounding-exercises/
Sensory attention is offered for overwhelming anxiety/stress. Our flexible contact-and-sound guides adapt that principle; they are not a validated 5-4-3-2-1 protocol.

[8] Mischkowski, Kross & Bushman (2012), self-distancing after provocation.
https://doi.org/10.1016/j.jesp.2012.03.012
Laboratory experiments found lower anger/aggression with a self-distanced perspective after provocation. Everyday situations and our exact wording were not tested.

[9] Samson & Gross (2012), positive versus negative humor.
https://pubmed.ncbi.nlm.nih.gov/21756218/
Two negative-picture experiments favored good-natured over mean-spirited humor. This is indirect evidence for an anger episode, not proof that these jokes will work.
