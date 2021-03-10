import * as tut from "../../Tutorial/Core";
import * as tg from "../../TutorialGraph/index";
import { RequiredState } from "../../Tutorial/RequiredState";
import { freezePlayerHero, getOrError, getPlayerHero, removeContextEntityIfExists } from "../../util";
import { GoalTracker } from "../../Goals";

const sectionName: SectionName = SectionName.Chapter4_Communication;

let graph: tg.TutorialStep | undefined = undefined

/**
 * Describes the state we want the game to be in before this section is executed. The game will try to make the state match this required state.
 */
const requiredState: RequiredState = {
    requireSlacksGolem: true,
    requireSunsfanGolem: true,
    heroLocation: Vector(-1500, 4000, 256),
    heroLevel: 6,
    heroAbilityMinLevels: [1, 1, 1, 1],
};

const allyHeroStartLocation = Vector(-3000, 3800, 128);
const allyHeroEndLocation = Vector(-4000, 4800, 128);
const bountyRuneLocation = Vector(-3850, 2570);
const lunaName = "npc_dota_hero_luna";
const kunkkaName = "npc_dota_hero_kunkka";

/**
 * Called when the section is started and should contain the main logic.
 * @param complete Call this function to complete the section.
 */
function onStart(complete: () => void) {
    print("Starting", sectionName);

    const goalTracker = new GoalTracker();
    const goalPressVoiceChatButton = goalTracker.addBoolean("Press the team voice key (default 'V') and say hello.");
    const goalChatWheelWP = goalTracker.addBoolean("Use your chat wheel (default 'Y').");
    const goalGoToTopBountyRune = goalTracker.addBoolean("Go to the marked location.");

    const playerHero = getOrError(getPlayerHero(), "Could not find the player's hero.");

    graph = tg.withGoals(_ => goalTracker.getGoals(),
        tg.seq([
            tg.wait(1),

            tg.spawnUnit(lunaName, allyHeroStartLocation, DotaTeam.GOODGUYS, lunaName, true),
            tg.spawnUnit(kunkkaName, allyHeroStartLocation, DotaTeam.GOODGUYS, kunkkaName, true),
            tg.immediate(context => {
                const kunkka = getOrError(context[kunkkaName] as CDOTA_BaseNPC | undefined);
                kunkka.AddItemByName("item_lotus_orb");
                kunkka.AddItemByName("item_invis_sword");
                kunkka.AddItemByName("item_armlet");
                kunkka.AddItemByName("item_phase_boots");
                kunkka.AddItemByName("item_heart");
                kunkka.AddItemByName("item_monkey_king_bar");
            }),

            tg.setCameraTarget(contex => contex[kunkkaName]),

            tg.fork([
                tg.moveUnit(context => context[kunkkaName], Vector(-1500, 4000, 256).__sub(Vector(300, 200))),
                tg.moveUnit(context => context[lunaName], Vector(-1500, 4000, 256).__sub(Vector(500, 400))),
            ]),

            tg.immediate(context => {
                const kunkka = getOrError(context[kunkkaName] as CDOTA_BaseNPC | undefined);
                kunkka.FaceTowards(playerHero.GetAbsOrigin());
                const luna = getOrError(context[lunaName] as CDOTA_BaseNPC | undefined);
                luna.FaceTowards(playerHero.GetAbsOrigin());
            }),

            tg.textDialog(LocalizationKey.Script_4_Communication_1, ctx => ctx[lunaName], 3),
            tg.setCameraTarget(playerHero),
            tg.textDialog(LocalizationKey.Script_4_Communication_2, ctx => ctx[CustomNpcKeys.SunsFanMudGolem], 3),
            tg.textDialog(LocalizationKey.Script_4_Communication_3, ctx => ctx[CustomNpcKeys.SlacksMudGolem], 3),

            tg.immediate(_ => goalPressVoiceChatButton.start()),
            tg.waitForCommand(37), // Team voice
            tg.immediate(_ => goalPressVoiceChatButton.complete()),

            tg.textDialog(LocalizationKey.Script_4_Communication_4, ctx => ctx[CustomNpcKeys.SlacksMudGolem], 3),
            tg.textDialog(LocalizationKey.Script_4_Communication_5, ctx => ctx[CustomNpcKeys.SunsFanMudGolem], 3),
            tg.textDialog(LocalizationKey.Script_4_Communication_6, ctx => ctx[CustomNpcKeys.SlacksMudGolem], 3),

            tg.immediate(_ => goalChatWheelWP.start()),
            tg.waitForChatWheel(),
            tg.immediate(_ => goalChatWheelWP.complete()),
            tg.wait(1),
            tg.setCameraTarget(context => context[lunaName]),
            tg.textDialog(LocalizationKey.Script_4_Communication_7, ctx => ctx[lunaName], 3),
            tg.moveUnit(context => context[lunaName], allyHeroEndLocation),

            tg.setCameraTarget(context => context[kunkkaName]),
            tg.moveUnit(context => context[kunkkaName], context => context[kunkkaName].GetAbsOrigin().__add(Vector(100, 100))),
            tg.textDialog(LocalizationKey.Script_4_Communication_8, ctx => ctx[kunkkaName], 8),
            tg.textDialog(LocalizationKey.Script_4_Communication_9, ctx => ctx[CustomNpcKeys.SunsFanMudGolem], 3),
            tg.textDialog(LocalizationKey.Script_4_Communication_10, ctx => ctx[CustomNpcKeys.SlacksMudGolem], 8),
            tg.textDialog(LocalizationKey.Script_4_Communication_11, ctx => ctx[CustomNpcKeys.SunsFanMudGolem], 8),
            // TODO: Lightup scoreboard and mute screenshot
            // TODO: Spam Whoops
            tg.textDialog(LocalizationKey.Script_4_Communication_12, ctx => ctx[CustomNpcKeys.SunsFanMudGolem], 5),
            tg.textDialog(LocalizationKey.Script_4_Communication_13, ctx => ctx[CustomNpcKeys.SlacksMudGolem], 5),
            tg.textDialog(LocalizationKey.Script_4_Communication_14, ctx => ctx[CustomNpcKeys.SunsFanMudGolem], 3),
            tg.textDialog(LocalizationKey.Script_4_Communication_15, ctx => ctx[CustomNpcKeys.SlacksMudGolem], 3),

            // Kunkka destroy items
            tg.immediate(_ => freezePlayerHero(true)),
            tg.setCameraTarget(context => context[kunkkaName]),
            tg.loop(context => {
                const kunkka = getOrError(context[kunkkaName] as CDOTA_BaseNPC | undefined);
                context[kunkkaName] = kunkka;
                for (let i = 0; i < 6; i++) {
                    const item = kunkka.GetItemInSlot(i)
                    if (item) {
                        context["ItemToDestroy"] = item;
                        return true;
                    }
                }
                return false;

            }, tg.seq([
                tg.immediate(context => {
                    context[kunkkaName].DropItemAtPosition(context[kunkkaName].GetAbsOrigin().__add(Vector(50, 50)), context["ItemToDestroy"]);
                }),
                tg.completeOnCheck(context => !context[kunkkaName].HasItemInInventory((context["ItemToDestroy"] as CDOTA_Item).GetName()), 0.8),
                tg.immediate(context => {
                    ExecuteOrderFromTable({
                        OrderType: UnitOrder.ATTACK_TARGET,
                        UnitIndex: context[kunkkaName].entindex(),
                        TargetIndex: (context["ItemToDestroy"] as CDOTA_Item).GetContainer()!.entindex(),
                    });
                }),
                tg.wait(1),
            ])),

            tg.moveUnit(context => context[kunkkaName], allyHeroEndLocation),
            tg.immediate(_ => freezePlayerHero(false)),
            tg.setCameraTarget(playerHero),

            tg.textDialog(LocalizationKey.Script_4_Communication_16, ctx => ctx[CustomNpcKeys.SunsFanMudGolem], 5),
            tg.textDialog(LocalizationKey.Script_4_Communication_17, ctx => ctx[CustomNpcKeys.SlacksMudGolem], 5),

            tg.immediate(_ => goalGoToTopBountyRune.start()),
            tg.goToLocation(bountyRuneLocation),
            tg.immediate(_ => goalGoToTopBountyRune.complete()),
        ])
    )
    graph.start(GameRules.Addon.context, () => {
        print("Completed", sectionName);
        disposeHeroes(GameRules.Addon.context);
        complete();
    });
}

/**
 * Called when this section is cancelled and should clean up any progress such as spawned units.
 */
function onStop() {
    print("Stopping", sectionName);

    if (graph) {
        graph.stop(GameRules.Addon.context);
        graph = undefined;
    }
}

function disposeHeroes(context: tg.TutorialContext) {
    removeContextEntityIfExists(context, kunkkaName);
    removeContextEntityIfExists(context, lunaName);
}

export const sectionCommunication = new tut.FunctionalSection(
    sectionName,
    requiredState,
    onStart,
    onStop
);
