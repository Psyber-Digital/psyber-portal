# The proposed replacement per-week copy, for counting.
NEW = {
1: dict(
 banner="One question runs through this session: what could derail you on the way to becoming a successful coach? We name it now, while it costs nothing.",
 note=["We do this first because it is far easier to handle what could derail you once you have seen it coming.",
       "Bring the sheet rough. Half-formed answers and question marks are welcome — you are not meant to finish it alone. We finish it together on the call.",
       "And start your contact list. It runs for the next few weeks rather than one evening: add people whenever they come to mind, and keep adding. One rule: your current therapy clients don’t go on it."],
 video="A walk through your Working Sheet, block by block, so you know exactly what each one is asking.",
 workbook="Four blocks, one question: what could derail you? One focused sitting."),
2: dict(
 banner="Generate wide, narrow later, research the last three — then we pick one together on the call.",
 note=["More pre-work than most this week, deliberately. Generating and researching are things you can do alone. Deciding is not — that is what our session is for.",
       "Do the stages in separate sittings if you can. Generating and judging at once flattens your ideas, and a night’s gap usually produces something you would not have reached in one go.",
       "Nothing goes out this week. You need the words before you can tell anyone, and that is the next session — so this week is yours to think in."],
 video="What niching actually does for you, the advantage you already have, and a walk through the three stages of your Working Sheet.",
 workbook="Three stages, in order: generate everything, narrow it down, then research your top three. Finish each stage before moving on. Do not pick a winner — bring all three and what you found, and we choose together on the call."),
3: dict(
 banner="Your client is the hero of this story and you are the guide. This session gives you the words — and your announcement goes out at the end of it.",
 note=["The most valuable material here is their language, not yours — the exact phrases you have heard from the people you are serving.",
       "By the end of our session your announcement goes out. Written together, sent the same day."],
 video="Why your client is the hero and you are the guide, and the five things every message needs.",
 workbook="Work backwards from what actually gets sent. We fill only what feeds your announcement and the three answers — the rest waits until you have a real client."),
4: dict(
 banner="The map and the number. By the end of this session you have something somebody can buy.",
 note=["The map is one page: modules, what changes for the client at the end of each, and how many weeks. The detail inside each module comes later, once there is a real client to build it for."],
 video="A one-page map with an objective for every module, what actually creates value when you have no testimonials, the four offer enhancers, and how to set your price.",
 workbook="One page for the map, two numbers for the price. If you find yourself designing slides or naming units, that is a level deeper than this session needs — come back."),
5: dict(
 banner="We build your first session together, in the hour, from a template. There is a floor you only have to clear.",
 note=["This session works differently: the slide template already has the gaps marked, you leave the call with it finished, and we send you the file afterwards.",
       "So the pre-work is deliberately light. Please do not polish, and please do not open a design tool.",
       "One thing to read before we speak, because it is the most important instruction in this program: there is a minimum standard, and once you have cleared it you are finished. Not when it feels finished. When it clears the floor."],
 video="What your first session is actually for, the minimum it has to contain, and the template we fill in together on the call.",
 workbook="This sheet runs in the same order as the template, block for slide, so whichever you open first the other one fills in. Rough first thoughts only — four scruffy lines is a good outcome, and we build the rest together on the call."),
6: dict(
 banner="The discovery call, step by step — a conversation you are already unusually good at, with a structure for the last ten minutes.",
 note=["Most of our session is rehearsal rather than discussion. Come ready to say things out loud.",
       "The two parts people find hardest are saying the price and then staying quiet, and answering the two questions that only come up for therapists. We practice both.",
       "If you have had any real conversations already, bring what happened — especially the ones that went badly."],
 video="The discovery call in order, from setting the agenda to asking for the decision — including the price moment and the action-taking discount.",
 workbook="This sheet follows the call in order. Write your own version of each step, then read the whole thing aloud twice before our session."),
7: dict(
 banner="Volume, done properly. The whole list worked — and the number that makes a first client likely rather than lucky.",
 note=["This session teaches nothing new. It is about doing more of what you started in session two, systematically, until the numbers work.",
       "Come to our session with your list open. We work through it live, and messages go out while we are talking — including the ones you have been putting off."],
 video="Where the target number comes from, why connectors do most of the work, and the rhythm that reaches 250 people without taking over your week.",
 workbook="Short sheet, busy week. Most of your time goes on the list rather than on this page."),
}
if __name__ == "__main__":
    import sys; sys.path.insert(0,"/Users/asher/HQ/Projects/1-PsyberDigital/Programme/Flagship/build")
    from content_v3 import WEEKS
    c=lambda s: len(s.split())
    ta=tb=0
    print(f"{'wk':>3} {'before':>7} {'after':>6} {'delta':>6}")
    for w in WEEKS:
        n=w['n']; N=NEW[n]
        a=c(w['banner_intro'])+sum(c(p) for p in w['note'])+c(w['video_blurb'])+c(w['workbook_intro'])
        b=c(N['banner'])+sum(c(p) for p in N['note'])+c(N['video'])+c(N['workbook'])
        ta+=a; tb+=b
        print(f"{n:>3} {a:>7} {b:>6} {b-a:>+6}")
    print(f"{'tot':>3} {ta:>7} {tb:>6} {tb-ta:>+6}")
    print(f"\nresources blurb (15 x 7 = 105) -> 9 (week 1 only): -96")
    print(f"GRAND: {ta+105} -> {tb+9} ({tb+9-(ta+105):+d})")
