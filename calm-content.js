/* Original scripts, research-informed; not clinically validated audio. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CalmContent=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){return {
  "version": "7.0.0-calm1",
  "sources": [
    {
      "id": "anger2024",
      "title": "Kjærvik & Bushman (2024), anger-management meta-analysis",
      "url": "https://pubmed.ncbi.nlm.nih.gov/38518585/",
      "note": "154 studies; arousal-decreasing activities reduced anger/aggression overall. Supports lowering arousal, not a guarantee for these scripts or for an individual episode."
    },
    {
      "id": "breath2023",
      "title": "Fincham et al. (2023), randomized breathwork trial meta-analysis",
      "url": "https://pubmed.ncbi.nlm.nih.gov/36624160/",
      "note": "12 trials, 785 adults for stress; small-to-medium average effect, mostly moderate risk of bias. Programs and doses differ from these short guides."
    },
    {
      "id": "balban2023",
      "title": "Balban et al. (2023), daily brief breathing randomized trial",
      "url": "https://pubmed.ncbi.nlm.nih.gov/36630953/",
      "note": "Five minutes per day for one month; exhale-focused cyclic sighing improved positive affect and reduced respiratory rate relative to mindfulness. Not an anger-crisis trial, and these guides do not reproduce its protocol."
    },
    {
      "id": "nhsBreathing",
      "title": "NHS: breathing exercises for stress",
      "url": "https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/",
      "note": "Clinical self-help guidance emphasizes comfortable, gentle breathing without force. Our counts are optional; no holds or rapid breathing."
    },
    {
      "id": "relaxation2021",
      "title": "Toussaint et al. (2021), relaxation techniques randomized comparison",
      "url": "https://pubmed.ncbi.nlm.nih.gov/34306146/",
      "note": "60 healthy undergraduates, 20-minute audio sessions. Supports relaxation training; the brief release-only scripts here are an adaptation, not the tested PMR protocol."
    },
    {
      "id": "who2020",
      "title": "WHO (2020): Doing What Matters in Times of Stress",
      "url": "https://www.who.int/publications/i/item/9789240003927",
      "note": "Evidence-informed, field-tested stress self-help guidance including grounding and unhooking. Not proof that our short audio treats acute anger."
    },
    {
      "id": "groundingNHS",
      "title": "NHS inform: grounding exercises",
      "url": "https://www.nhsinform.scot/healthy-living/mental-wellbeing/breathing-and-relaxation-exercises/grounding-exercises/",
      "note": "Sensory attention is offered for overwhelming anxiety/stress. Our flexible contact-and-sound guides adapt that principle; they are not a validated 5-4-3-2-1 protocol."
    },
    {
      "id": "distancing2012",
      "title": "Mischkowski, Kross & Bushman (2012), self-distancing after provocation",
      "url": "https://doi.org/10.1016/j.jesp.2012.03.012",
      "note": "Laboratory experiments found lower anger/aggression with a self-distanced perspective after provocation. Everyday situations and our exact wording were not tested."
    },
    {
      "id": "humor2012",
      "title": "Samson & Gross (2012), positive versus negative humor",
      "url": "https://pubmed.ncbi.nlm.nih.gov/21756218/",
      "note": "Two negative-picture experiments favored good-natured over mean-spirited humor. This is indirect evidence for an anger episode, not proof that these jokes will work."
    }
  ],
  "categories": [
    {
      "id": "ground",
      "label": "Ground me",
      "detail": "Shift attention to contact, sound, and what is here.",
      "evidence": "Clinical guidance; direct anger-specific evidence is limited."
    },
    {
      "id": "down",
      "label": "Bring me down",
      "detail": "Comfortable breathing and less muscle tension.",
      "evidence": "Strongest anger-related foundation here: reducing arousal."
    },
    {
      "id": "unstuck",
      "label": "Get me unstuck",
      "detail": "Step back from the loop and choose one next action.",
      "evidence": "Laboratory evidence for self-distancing; adapted here."
    },
    {
      "id": "humor",
      "label": "Make me laugh",
      "detail": "Harmless absurdity, not insults or forced positivity.",
      "evidence": "Promising but indirect evidence; easy to skip."
    }
  ],
  "sessions": [
    {
      "id": "ground-contact",
      "kind": "ground",
      "title": "Feet, seat, sound",
      "eyes": "optional",
      "sources": [
        "who2020",
        "groundingNHS"
      ],
      "steps": [
        {
          "text": "Only use this while stopped, away from driving or machinery. If anyone is in immediate danger, get help first. For now, you do not need to solve the problem. Give yourself a little time before acting.",
          "pauseMs": 2000
        },
        {
          "text": "Sit or stand somewhere steady. Keep your eyes open if that feels better. Closing them is optional, never a requirement.",
          "pauseMs": 4000
        },
        {
          "text": "Find where your feet contact the floor. Notice pressure at your heels and at the front of each foot. You are looking for ordinary sensations, not a special feeling.",
          "pauseMs": 10000
        },
        {
          "text": "Now notice the support under you: a chair, the floor, or the back of a seat. Let that support take some of your weight.",
          "pauseMs": 8000
        },
        {
          "text": "Rest one hand on the other, or on a stable surface. Notice texture and temperature. Do not grip harder; just notice contact.",
          "pauseMs": 10000
        },
        {
          "text": "Pick out one sound nearby. Then another farther away. No need to decide whether you like them. Let each sound be just a sound.",
          "pauseMs": 12000
        },
        {
          "text": "The argument may come back into your attention. That is not a failed exercise. Name it: there is the argument again. Return to the pressure under your feet.",
          "pauseMs": 10000
        },
        {
          "text": "Notice your hands once more. Then your feet. Let your breathing happen normally. You do not need to change or monitor it.",
          "pauseMs": 10000
        },
        {
          "text": "Choose one safe, ordinary action for the next minute. Stay seated, put an object down, or ask for a break. Keep the decision small.",
          "pauseMs": 8000
        },
        {
          "text": "Check whether you have a little more room to choose your next action. You do not have to feel good. If you are still too wound up, keep the break going. You can stop here or try a different guide.",
          "pauseMs": 3000
        }
      ]
    },
    {
      "id": "ground-room",
      "kind": "ground",
      "title": "Read the room, not the argument",
      "eyes": "open",
      "sources": [
        "who2020",
        "groundingNHS"
      ],
      "steps": [
        {
          "text": "Only use this while stopped, away from driving or machinery. If anyone is in immediate danger, get help first. For now, you do not need to solve the problem. Give yourself a little time before acting.",
          "pauseMs": 2000
        },
        {
          "text": "Keep your eyes open for this guide. Look around the place you are actually in. If looking around is uncomfortable, use the sounds and contact points instead.",
          "pauseMs": 4000
        },
        {
          "text": "Find three objects that have straight edges. Describe their shapes silently. Leave the story about the other person out of it for a moment.",
          "pauseMs": 12000
        },
        {
          "text": "Find two different colors. Notice where the color changes at the edge of each object. You do not have to search the whole room.",
          "pauseMs": 10000
        },
        {
          "text": "Notice one surface touching your body. It could be your shoe, sleeve, chair, or the floor. Describe that contact in plain physical terms.",
          "pauseMs": 10000
        },
        {
          "text": "Find the quietest sound you can hear. Then a louder one. Hearing either of them is enough; there is no correct answer.",
          "pauseMs": 10000
        },
        {
          "text": "Say to yourself where you are, and what you are doing right now. Not what happened earlier. For example: I am standing in this room, taking a short break.",
          "pauseMs": 8000
        },
        {
          "text": "Your attention may jump back to the problem. Bring it back to one edge, one color, and the support beneath you.",
          "pauseMs": 10000
        },
        {
          "text": "You can return to the issue without answering it immediately. For now, choose what will keep the next minute from becoming harder.",
          "pauseMs": 8000
        },
        {
          "text": "Check whether you have a little more room to choose your next action. You do not have to feel good. If you are still too wound up, keep the break going. You can stop here or try a different guide.",
          "pauseMs": 3000
        }
      ]
    },
    {
      "id": "ground-hands",
      "kind": "ground",
      "title": "Something solid",
      "eyes": "optional",
      "sources": [
        "who2020",
        "groundingNHS"
      ],
      "steps": [
        {
          "text": "Only use this while stopped, away from driving or machinery. If anyone is in immediate danger, get help first. For now, you do not need to solve the problem. Give yourself a little time before acting.",
          "pauseMs": 2000
        },
        {
          "text": "Put down anything sharp, breakable, or distracting. Rest your hands on your legs or on a stable surface. Eyes open or closed, whichever is more comfortable.",
          "pauseMs": 5000
        },
        {
          "text": "Notice your left hand. Where does it touch something? Is that surface smooth, rough, warm, or cool? Describe it without judging it.",
          "pauseMs": 10000
        },
        {
          "text": "Move your attention to your right hand. Notice the fingertips, the palm, and where the hand is supported. No need to change anything.",
          "pauseMs": 10000
        },
        {
          "text": "Feel both feet at the same time. Let your toes rest. You are checking what is physically here, rather than replaying what happened.",
          "pauseMs": 10000
        },
        {
          "text": "Listen to a sound that is already present. Follow it for a moment. If there is little to hear, return to the surface under your hands.",
          "pauseMs": 12000
        },
        {
          "text": "When a thought interrupts, acknowledge it once. Then choose contact or sound again. You are not required to clear your mind.",
          "pauseMs": 10000
        },
        {
          "text": "Let your jaw rest and make your grip less firm. Keep your breathing ordinary. Small changes are enough for this exercise.",
          "pauseMs": 8000
        },
        {
          "text": "Before you move on, choose a place to keep your attention during the next minute. Your feet, a neutral object, or a steady sound will do.",
          "pauseMs": 8000
        },
        {
          "text": "Check whether you have a little more room to choose your next action. You do not have to feel good. If you are still too wound up, keep the break going. You can stop here or try a different guide.",
          "pauseMs": 3000
        }
      ]
    },
    {
      "id": "ground-now",
      "kind": "ground",
      "title": "Here, then next",
      "eyes": "optional",
      "sources": [
        "who2020",
        "groundingNHS"
      ],
      "steps": [
        {
          "text": "Only use this while stopped, away from driving or machinery. If anyone is in immediate danger, get help first. For now, you do not need to solve the problem. Give yourself a little time before acting.",
          "pauseMs": 2000
        },
        {
          "text": "Stay somewhere steady. You can keep your eyes open throughout. Notice three places where your body is supported, such as feet, seat, and back.",
          "pauseMs": 10000
        },
        {
          "text": "Describe one of those contact points silently. Pressure, warmth, firmness, or texture. Stay with what you can actually notice.",
          "pauseMs": 10000
        },
        {
          "text": "Listen for one sound. Let it begin and end without explaining it. Then return to the support under you.",
          "pauseMs": 10000
        },
        {
          "text": "The aim is not to decide who was wrong. It is to bring some attention back to the present while the feeling is still here.",
          "pauseMs": 6000
        },
        {
          "text": "Name one thing happening now that is separate from the problem. An appliance is running. Light is coming through a window. Your hand is resting on your leg.",
          "pauseMs": 10000
        },
        {
          "text": "Notice your feet again. Let your hands open a little. If concentrating on your body feels worse, look at a neutral object instead.",
          "pauseMs": 10000
        },
        {
          "text": "What is one action available to you now? You can delay a reply, step into another room, or ask for time. Pick the smallest safe option.",
          "pauseMs": 10000
        },
        {
          "text": "Let the larger problem wait while you take that one action. A pause does not mean you approve of what happened.",
          "pauseMs": 6000
        },
        {
          "text": "Check whether you have a little more room to choose your next action. You do not have to feel good. If you are still too wound up, keep the break going. You can stop here or try a different guide.",
          "pauseMs": 3000
        }
      ]
    },
    {
      "id": "down-exhale",
      "kind": "down",
      "title": "Less effort, slower out",
      "eyes": "optional",
      "sources": [
        "anger2024",
        "breath2023",
        "nhsBreathing"
      ],
      "steps": [
        {
          "text": "Only use this while stopped, away from driving or machinery. If anyone is in immediate danger, get help first. For now, you do not need to solve the problem. Give yourself a little time before acting.",
          "pauseMs": 2000
        },
        {
          "text": "Sit comfortably. Eyes closed is optional. Keep each breath easy, not bigger. If this makes you dizzy, short of breath, or more distressed, stop the pacing and breathe normally.",
          "pauseMs": 4000
        },
        {
          "text": "Let your shoulders lower a little. Rest your hands. Leave a small space between your teeth rather than clamping your jaw.",
          "pauseMs": 8000
        },
        {
          "text": "Take an ordinary, gentle breath in. Let it out slightly more slowly, if that feels comfortable. No breath hold. No need to empty your lungs.",
          "pauseMs": 10000
        },
        {
          "text": "Do that again at your own pace. Easy in, unforced out. If a longer exhale feels wrong, use the same comfortable length in both directions.",
          "pauseMs": 18000
        },
        {
          "text": "Let the next few breaths be quiet and comfortable. This is not a test of lung capacity. Breathe again whenever you need to.",
          "pauseMs": 20000
        },
        {
          "text": "Check your hands and shoulders. Are you gripping or bracing? Let go of a little unnecessary effort while keeping your breathing easy.",
          "pauseMs": 10000
        },
        {
          "text": "Take a few more comfortable breaths. When the argument returns, come back to the next easy exhale rather than answering it.",
          "pauseMs": 18000
        },
        {
          "text": "Now stop adjusting your breathing. Let it settle into its own rhythm. Notice whether the tension has changed at all, without demanding that it disappear.",
          "pauseMs": 8000
        },
        {
          "text": "Check whether you have a little more room to choose your next action. You do not have to feel good. If you are still too wound up, keep the break going. You can stop here or try a different guide.",
          "pauseMs": 3000
        }
      ]
    },
    {
      "id": "down-release",
      "kind": "down",
      "title": "Unclench first",
      "eyes": "optional",
      "sources": [
        "anger2024",
        "relaxation2021"
      ],
      "steps": [
        {
          "text": "Only use this while stopped, away from driving or machinery. If anyone is in immediate danger, get help first. For now, you do not need to solve the problem. Give yourself a little time before acting.",
          "pauseMs": 2000
        },
        {
          "text": "This one does not require breath counting. Breathe normally throughout. Sit or stand steadily, and keep your eyes open if you prefer.",
          "pauseMs": 5000
        },
        {
          "text": "Start with your hands. Open them gently and rest them on something. Do not stretch hard or work through pain. Just reduce the grip.",
          "pauseMs": 12000
        },
        {
          "text": "Notice your shoulders. Let them move away from your ears a little. There is no need to force them down.",
          "pauseMs": 12000
        },
        {
          "text": "Let your jaw rest. Leave your teeth slightly apart, if comfortable. Soften the muscles around your eyes and forehead rather than squeezing them.",
          "pauseMs": 12000
        },
        {
          "text": "Check your legs and feet. Release any unnecessary bracing while keeping yourself supported. You do not need to tense the muscles first.",
          "pauseMs": 12000
        },
        {
          "text": "Now return to your hands. You may have tightened them again. That is useful information, not something to criticize. Let them rest again.",
          "pauseMs": 10000
        },
        {
          "text": "Give the shoulders and jaw another chance to loosen. Leave your breathing alone. Stay with the smaller amount of effort for a few moments.",
          "pauseMs": 18000
        },
        {
          "text": "Notice what remains tense. Nothing has to be perfect. You can deal with the issue without keeping every muscle ready for it.",
          "pauseMs": 8000
        },
        {
          "text": "Check whether you have a little more room to choose your next action. You do not have to feel good. If you are still too wound up, keep the break going. You can stop here or try a different guide.",
          "pauseMs": 3000
        }
      ]
    },
    {
      "id": "down-rhythm",
      "kind": "down",
      "title": "A comfortable rhythm",
      "eyes": "optional",
      "sources": [
        "anger2024",
        "breath2023",
        "nhsBreathing"
      ],
      "steps": [
        {
          "text": "Only use this while stopped, away from driving or machinery. If anyone is in immediate danger, get help first. For now, you do not need to solve the problem. Give yourself a little time before acting.",
          "pauseMs": 2000
        },
        {
          "text": "Keep your breaths small and comfortable. You can follow a count, but do not chase one. Stop counting and breathe normally if you feel dizzy, breathless, or more uncomfortable.",
          "pauseMs": 4000
        },
        {
          "text": "Try counting gently to three while breathing in, and to four while breathing out. No pause in between. Shorten either count whenever you need to.",
          "pauseMs": 10000
        },
        {
          "text": "Try another few breaths at that comfortable rhythm. The count is optional. Ease matters more than matching numbers.",
          "pauseMs": 20000
        },
        {
          "text": "Let your hands rest. Unclench your jaw. Keep the shoulders from doing extra work with each breath.",
          "pauseMs": 10000
        },
        {
          "text": "Use a few more easy breaths. If your attention wanders into the argument, notice that and return to the next breath without starting the argument again.",
          "pauseMs": 20000
        },
        {
          "text": "You can drop the count now. Let the out-breath be comfortable and unforced, even if it is no longer than the in-breath.",
          "pauseMs": 15000
        },
        {
          "text": "Notice the support underneath you. Let your breathing choose its own pace. Check whether you have a little less urge to react immediately.",
          "pauseMs": 10000
        },
        {
          "text": "Check whether you have a little more room to choose your next action. You do not have to feel good. If you are still too wound up, keep the break going. You can stop here or try a different guide.",
          "pauseMs": 3000
        }
      ]
    },
    {
      "id": "down-reset",
      "kind": "down",
      "title": "A short physical reset",
      "eyes": "optional",
      "sources": [
        "anger2024",
        "relaxation2021",
        "nhsBreathing"
      ],
      "steps": [
        {
          "text": "Only use this while stopped, away from driving or machinery. If anyone is in immediate danger, get help first. For now, you do not need to solve the problem. Give yourself a little time before acting.",
          "pauseMs": 2000
        },
        {
          "text": "Get your weight supported. Eyes closed is optional. Begin with ordinary breathing. You are reducing effort, not trying to breathe as deeply as possible.",
          "pauseMs": 5000
        },
        {
          "text": "Let your fingers uncurl. Rest them against your legs or a stable surface. Leave them there without squeezing.",
          "pauseMs": 10000
        },
        {
          "text": "Release a little tension in your jaw and forehead. Move your shoulders gently, then let them rest. Skip any movement that hurts.",
          "pauseMs": 10000
        },
        {
          "text": "On the next easy breath, let the exhale take its time. Do not hold the breath or push the air out. If breath focus feels worse, leave it alone and notice your feet instead.",
          "pauseMs": 10000
        },
        {
          "text": "For the next few breaths, keep the same small effort. You do not need to match my voice or any count.",
          "pauseMs": 20000
        },
        {
          "text": "Check whether your hands tightened again. Relax the grip and return to the support under you. That is the whole task for the next few moments.",
          "pauseMs": 15000
        },
        {
          "text": "Let breathing return to its usual rhythm. Notice the urge to act without acting on it yet. You can take more time before the next conversation.",
          "pauseMs": 10000
        },
        {
          "text": "Choose one safe next move that does not require winning or fixing everything. Putting down the phone for another minute is an option.",
          "pauseMs": 8000
        },
        {
          "text": "Check whether you have a little more room to choose your next action. You do not have to feel good. If you are still too wound up, keep the break going. You can stop here or try a different guide.",
          "pauseMs": 3000
        }
      ]
    },
    {
      "id": "unstuck-notice",
      "kind": "unstuck",
      "title": "Name it without obeying it",
      "eyes": "optional",
      "sources": [
        "who2020",
        "distancing2012"
      ],
      "steps": [
        {
          "text": "Only use this while stopped, away from driving or machinery. If anyone is in immediate danger, get help first. For now, you do not need to solve the problem. Give yourself a little time before acting.",
          "pauseMs": 2000
        },
        {
          "text": "Keep your eyes open or closed, as comfortable. You do not have to settle whether your thought is correct during this exercise.",
          "pauseMs": 5000
        },
        {
          "text": "Name the sentence that keeps coming back, once. Keep it short. Do not rehearse the full exchange or build a case against anyone.",
          "pauseMs": 10000
        },
        {
          "text": "Now put these words in front of it: I am noticing the thought that. Then name the thought once more. A thought can be important without being an instruction.",
          "pauseMs": 10000
        },
        {
          "text": "Notice one contact point, such as your feet on the floor. Give that sensation a few moments of attention while the thought is allowed to be there.",
          "pauseMs": 12000
        },
        {
          "text": "Imagine what you would advise someone you care about in this exact situation. Not who should win. What would help them avoid making things worse right now?",
          "pauseMs": 12000
        },
        {
          "text": "Pick one sentence from that advice. Keep it practical: wait before sending, ask one question, or take a break before speaking.",
          "pauseMs": 10000
        },
        {
          "text": "The thought may return before you feel settled. You can notice it again without supplying the next line of the argument.",
          "pauseMs": 10000
        },
        {
          "text": "Choose one action for the next few minutes. You can come back to the problem later, with more room to decide how to handle it.",
          "pauseMs": 8000
        },
        {
          "text": "Check whether you have a little more room to choose your next action. You do not have to feel good. If you are still too wound up, keep the break going. You can stop here or try a different guide.",
          "pauseMs": 3000
        }
      ]
    },
    {
      "id": "unstuck-observer",
      "kind": "unstuck",
      "title": "Take the outside view",
      "eyes": "optional",
      "sources": [
        "distancing2012",
        "who2020"
      ],
      "steps": [
        {
          "text": "Only use this while stopped, away from driving or machinery. If anyone is in immediate danger, get help first. For now, you do not need to solve the problem. Give yourself a little time before acting.",
          "pauseMs": 2000
        },
        {
          "text": "Leave your breathing alone. Feel the support beneath you. You can keep your eyes open. This is about perspective, not denying what happened.",
          "pauseMs": 5000
        },
        {
          "text": "Describe the situation as a neutral observer might. One sentence, using observable actions. Leave out guesses about motives and words such as always or never.",
          "pauseMs": 12000
        },
        {
          "text": "Now notice what this person needs in the next few minutes. More information? Some space? Time before responding? You are the person you are helping.",
          "pauseMs": 12000
        },
        {
          "text": "Ask what you would want this person to do so tomorrow is not harder. You do not have to excuse anyone else to answer that.",
          "pauseMs": 12000
        },
        {
          "text": "Look for one controllable action. Change where you are standing. Set the message aside. State that you need a break and will return to the conversation.",
          "pauseMs": 10000
        },
        {
          "text": "Notice whether your mind is trying to resume the argument. Return to describing the next action, rather than deciding the other person’s character.",
          "pauseMs": 10000
        },
        {
          "text": "Feel your feet or the chair again. Take a moment before deciding whether to act. No need to rush because a thought feels urgent.",
          "pauseMs": 10000
        },
        {
          "text": "Keep the next step small and safe. A different perspective is a tool to try, not a demand that you agree with anyone.",
          "pauseMs": 6000
        },
        {
          "text": "Check whether you have a little more room to choose your next action. You do not have to feel good. If you are still too wound up, keep the break going. You can stop here or try a different guide.",
          "pauseMs": 3000
        }
      ]
    },
    {
      "id": "unstuck-reply",
      "kind": "unstuck",
      "title": "Do not send it yet",
      "eyes": "optional",
      "sources": [
        "who2020",
        "distancing2012"
      ],
      "steps": [
        {
          "text": "Only use this while stopped, away from driving or machinery. If anyone is in immediate danger, get help first. For now, you do not need to solve the problem. Give yourself a little time before acting.",
          "pauseMs": 2000
        },
        {
          "text": "Set aside the message, tool, or conversation for a moment. Keep your eyes open or closed as comfortable, and let your hands rest.",
          "pauseMs": 5000
        },
        {
          "text": "Notice the reply you want to give. You do not need to say it aloud. Name the main urge once: correct them, defend yourself, leave, or force an answer.",
          "pauseMs": 10000
        },
        {
          "text": "An urge is something you notice. You can choose when and how to act on it. For this short break, no reply is required.",
          "pauseMs": 10000
        },
        {
          "text": "Ask what matters in this interaction after the heat has passed. Getting the task done? Being clear? Protecting the relationship? Keeping a boundary?",
          "pauseMs": 12000
        },
        {
          "text": "Choose one of those aims. Notice how the next action could serve it without trying to settle every part of the disagreement.",
          "pauseMs": 12000
        },
        {
          "text": "Now imagine advising a friend with the same aim. What short, useful action would you suggest? Give yourself that same option.",
          "pauseMs": 12000
        },
        {
          "text": "Feel the contact under your hands and feet. Let the reply wait a little longer. Not sending immediately leaves options open.",
          "pauseMs": 10000
        },
        {
          "text": "When you return, you can ask a question or state a boundary in a shorter sentence. You do not have to decide the exact wording now.",
          "pauseMs": 6000
        },
        {
          "text": "Check whether you have a little more room to choose your next action. You do not have to feel good. If you are still too wound up, keep the break going. You can stop here or try a different guide.",
          "pauseMs": 3000
        }
      ]
    },
    {
      "id": "unstuck-next",
      "kind": "unstuck",
      "title": "One thing, not everything",
      "eyes": "optional",
      "sources": [
        "who2020",
        "distancing2012"
      ],
      "steps": [
        {
          "text": "Only use this while stopped, away from driving or machinery. If anyone is in immediate danger, get help first. For now, you do not need to solve the problem. Give yourself a little time before acting.",
          "pauseMs": 2000
        },
        {
          "text": "Leave the whole problem alone for a minute. Keep your body supported and your eyes however you prefer. The goal is a next step, not a verdict.",
          "pauseMs": 5000
        },
        {
          "text": "Name what happened in one brief sentence. Stop there. You do not need the entire history of the situation for this exercise.",
          "pauseMs": 10000
        },
        {
          "text": "Notice the meaning your mind added. For example: I am being ignored, I have failed, or this will never change. Name it as a thought, not a confirmed conclusion.",
          "pauseMs": 12000
        },
        {
          "text": "Ask which part you actually control during the next five minutes. Your next words, whether you send the message, where you stand, or whether you take more time.",
          "pauseMs": 12000
        },
        {
          "text": "Pick one action from that small list. Make it specific enough that you could do it without solving the bigger issue.",
          "pauseMs": 12000
        },
        {
          "text": "Imagine someone you care about taking that step. Would you insist they fix everything first, or let the small useful step count?",
          "pauseMs": 10000
        },
        {
          "text": "Let the original thought exist without answering it again. Notice your feet and your hands while giving yourself another short pause.",
          "pauseMs": 12000
        },
        {
          "text": "Return to the step you chose. You can decide later what else needs attention. You have not given up the problem by pausing it.",
          "pauseMs": 6000
        },
        {
          "text": "Check whether you have a little more room to choose your next action. You do not have to feel good. If you are still too wound up, keep the break going. You can stop here or try a different guide.",
          "pauseMs": 3000
        }
      ]
    },
    {
      "id": "humor-committee",
      "kind": "humor",
      "title": "The emergency committee",
      "eyes": "optional",
      "sources": [
        "humor2012",
        "distancing2012"
      ],
      "steps": [
        {
          "text": "Only use this while stopped, away from driving or machinery. If anyone is in immediate danger, get help first. For now, you do not need to solve the problem. Give yourself a little time before acting.",
          "pauseMs": 2000
        },
        {
          "text": "Try a little absurdity, not a joke at your expense. If humor feels irritating or the situation is serious, skip it and choose a grounding guide.",
          "pauseMs": 4000
        },
        {
          "text": "Picture your sense of urgency as a tiny emergency committee. They have called an all-hands meeting. Nobody brought an agenda, but someone has ordered three more whiteboards.",
          "pauseMs": 7000
        },
        {
          "text": "The committee has a proposed action plan: repeat the same argument, at greater volume, until the laws of reality give in. Excellent use of office supplies. Questionable project management.",
          "pauseMs": 8000
        },
        {
          "text": "No need to fire the committee. Tell them the decision is paused while the person actually responsible takes a short break. That person is you.",
          "pauseMs": 8000
        },
        {
          "text": "Give the committee one ridiculous administrative task. Alphabetize the paperclips. Prepare a forty-page report on why the stapler sounds judgmental. Let it be harmless and silly.",
          "pauseMs": 12000
        },
        {
          "text": "Notice whether there was even a small shift in your attention. A laugh is optional. No change is also an honest result.",
          "pauseMs": 10000
        },
        {
          "text": "Let the imaginary meeting fade. Feel your feet or the seat. Loosen your hands. Whatever happened still matters, but the meeting does not get to choose your behavior.",
          "pauseMs": 10000
        },
        {
          "text": "Choose one real action that needs less drama than the committee proposed. Waiting before replying is a perfectly workable action.",
          "pauseMs": 8000
        },
        {
          "text": "Check whether you have a little more room to choose your next action. You do not have to feel good. If you are still too wound up, keep the break going. You can stop here or try a different guide.",
          "pauseMs": 3000
        }
      ]
    },
    {
      "id": "humor-announcer",
      "kind": "humor",
      "title": "The unnecessary sports commentary",
      "eyes": "optional",
      "sources": [
        "humor2012",
        "groundingNHS"
      ],
      "steps": [
        {
          "text": "Only use this while stopped, away from driving or machinery. If anyone is in immediate danger, get help first. For now, you do not need to solve the problem. Give yourself a little time before acting.",
          "pauseMs": 2000
        },
        {
          "text": "This is a short experiment in harmless absurdity. Do not aim the joke at yourself or another person. You can switch guides immediately if this is not the moment.",
          "pauseMs": 4000
        },
        {
          "text": "Imagine an overenthusiastic sports announcer describing a completely ordinary object nearby. A chair. A cup. The edge of a desk. The stakes are impressively nonexistent.",
          "pauseMs": 8000
        },
        {
          "text": "The cup remains on the table. Incredible composure. The chair has made no attempt to escalate. Commentators are calling it a masterclass in sitting there.",
          "pauseMs": 8000
        },
        {
          "text": "Let the announcer describe your next useful move: a hand opens, shoulders lower, a reply remains unsent. No penalties. The crowd is mostly furniture.",
          "pauseMs": 10000
        },
        {
          "text": "You do not need to laugh on command. The point is to let something other than the argument occupy the microphone for a few moments.",
          "pauseMs": 12000
        },
        {
          "text": "Now drop the commentary and notice the real object. Its shape, its position, and one simple detail you had not noticed before.",
          "pauseMs": 12000
        },
        {
          "text": "Notice whether the urge to react has changed at all. Let your breathing be normal and your hands rest without gripping.",
          "pauseMs": 10000
        },
        {
          "text": "Pick the next useful action. You can take another minute before speaking. No one needs a dramatic finish to this particular event.",
          "pauseMs": 8000
        },
        {
          "text": "Check whether you have a little more room to choose your next action. You do not have to feel good. If you are still too wound up, keep the break going. You can stop here or try a different guide.",
          "pauseMs": 3000
        }
      ]
    },
    {
      "id": "humor-volume",
      "kind": "humor",
      "title": "The dramatic narrator",
      "eyes": "optional",
      "sources": [
        "humor2012",
        "distancing2012"
      ],
      "steps": [
        {
          "text": "Only use this while stopped, away from driving or machinery. If anyone is in immediate danger, get help first. For now, you do not need to solve the problem. Give yourself a little time before acting.",
          "pauseMs": 2000
        },
        {
          "text": "Try a change of tone, not a denial of what happened. Humor is optional. If it feels dismissive or irritating, stop this guide and try something else.",
          "pauseMs": 4000
        },
        {
          "text": "Imagine the sentence in your head being read by a very serious documentary narrator. The subject of this documentary is a spoon. The budget is enormous.",
          "pauseMs": 8000
        },
        {
          "text": "The spoon has encountered an unexpected delay. Experts are assembling. There will be a six-part series, two spin-offs, and a strongly worded letter to the drawer.",
          "pauseMs": 9000
        },
        {
          "text": "Let your mind make the production slightly more ridiculous. Tiny headphones for the spoon. A dramatic briefing from a whisk. Nobody needs to be the target.",
          "pauseMs": 12000
        },
        {
          "text": "Now give the narrator a plain fact: a person is upset, and is taking a short pause before deciding what to do. The documentary can wait.",
          "pauseMs": 8000
        },
        {
          "text": "Check whether your attention moved, even briefly. You do not have to be amused for the exercise to end. No need to force a result.",
          "pauseMs": 10000
        },
        {
          "text": "Return to one real sound and the support beneath you. Let your jaw rest. Leave your breathing at a comfortable natural pace.",
          "pauseMs": 12000
        },
        {
          "text": "Choose a useful next step that does not require the documentary crew. A break, a question, or a delayed reply is enough to begin.",
          "pauseMs": 8000
        },
        {
          "text": "Check whether you have a little more room to choose your next action. You do not have to feel good. If you are still too wound up, keep the break going. You can stop here or try a different guide.",
          "pauseMs": 3000
        }
      ]
    },
    {
      "id": "humor-helpdesk",
      "kind": "humor",
      "title": "The internal help desk",
      "eyes": "optional",
      "sources": [
        "humor2012",
        "distancing2012"
      ],
      "steps": [
        {
          "text": "Only use this while stopped, away from driving or machinery. If anyone is in immediate danger, get help first. For now, you do not need to solve the problem. Give yourself a little time before acting.",
          "pauseMs": 2000
        },
        {
          "text": "This guide tries benign humor. Not insults, and not telling yourself the problem is stupid. If it does not fit, choose another guide without finishing this one.",
          "pauseMs": 4000
        },
        {
          "text": "Imagine your sense of urgency has opened a support ticket. Priority: everything. Description: unacceptable. Attachment: the same thought, uploaded seventeen times.",
          "pauseMs": 8000
        },
        {
          "text": "The help desk has one useful question: what action do we actually need right now? Unfortunately, the ticket currently contains only capital letters and a picture of a siren.",
          "pauseMs": 9000
        },
        {
          "text": "Give the help desk a harmlessly ridiculous supervisor. Perhaps a pigeon in a headset. The pigeon cannot solve the whole problem, but it is strongly in favor of a short pause.",
          "pauseMs": 12000
        },
        {
          "text": "Let the pigeon close the duplicate tickets. The real issue is still there. It does not need seventeen copies to be taken seriously.",
          "pauseMs": 8000
        },
        {
          "text": "Notice any small change in attention or tension. No laugh is required. If you feel worse, leave this exercise and use a straightforward grounding option.",
          "pauseMs": 10000
        },
        {
          "text": "Return to the actual room. Feel your feet, open your hands, and let breathing happen normally. The imaginary pigeon can finish its paperwork.",
          "pauseMs": 12000
        },
        {
          "text": "State one useful next move in ordinary words. It can be: I need a few minutes before replying. That is enough work for this ticket.",
          "pauseMs": 8000
        },
        {
          "text": "Check whether you have a little more room to choose your next action. You do not have to feel good. If you are still too wound up, keep the break going. You can stop here or try a different guide.",
          "pauseMs": 3000
        }
      ]
    }
  ]
};});
