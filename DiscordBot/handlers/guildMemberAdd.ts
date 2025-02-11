import { EmbedBuilder, EmbedData, GuildMember, TextChannel } from "discord.js";
import { config } from "node-config-ts";
import { Brackets } from "typeorm";
import { TournamentRoleType } from "../../Interfaces/tournament";
import { TournamentRole } from "../../Models/tournaments/tournamentRole";
import { User } from "../../Models/user";
import { discordClient } from "../../Server/discord";

export default async function guildMemberAdd (member: GuildMember) {
    const tournamentRolesToAdd = await TournamentRole
        .createQueryBuilder("role")
        .leftJoinAndSelect("role.tournament", "tournament")
        .leftJoinAndSelect("tournament.teams", "team")
        .leftJoinAndSelect("team.manager", "manager")
        .leftJoinAndSelect("team.members", "member")
        .where("tournament.server = :server", { server: member.guild.id })
        .andWhere(new Brackets(qb => {
            qb.where("role.roleType = '1'")
                .orWhere("role.roleType = '2'");
        }))
        .andWhere(new Brackets(qb => {
            qb.where("manager.discordUserid = :discord", { discord: member.id })
                .orWhere("member.discordUserid = :discord", { discord: member.id });
        }))
        .getMany();
    for (const role of tournamentRolesToAdd)
        if (
            role.tournament.teams.some(t => t.manager.discord.userID === member.id) ||
            (
                role.roleType === TournamentRoleType.Participants &&
                role.tournament.teams.some(t => t.members.some(m => m.discord.userID === member.id))
            )
        )
            await member.roles.add(role.roleID);

    // If this is a user joining the corsace server, add the streamannouncements and verified role as applicable
    if (member.guild.id === config.discord.guild) {
        const roles = [config.discord.roles.corsace.streamAnnouncements];
        const user = await User.findOne({
            where: {
                discord: {
                    userID: member.id,
                },
            },
        });
        if (user)
            roles.push(config.discord.roles.corsace.verified);
        else {
            try {
                await member.send("Hello and welcome to Corsace.\n\nIf u wanna type in the discord server, make sure u log in on osu! and then discord at https://corsace.io to obtain the `Verified` role. That will give u typing abilities");
            } catch (err) {
                const channel = discordClient.channels.cache.get(config.discord.coreChannel);
                if (channel instanceof TextChannel)
                    channel.send(`Failed to DM ${member.user.username} (${member.id})\n\`\`\`${err}\`\`\``);
            }
        }

        try {
            await member.roles.add(roles);
        } catch (err) {
            const channel = discordClient.channels.cache.get(config.discord.coreChannel);
            if (channel instanceof TextChannel)
                await channel.send(`Failed to add roles to ${member.user.username} (${member.id})\n\`\`\`${err}\`\`\``);
        }       

        const memberUser = member.user;
        const embed = new EmbedBuilder({
            title: `${memberUser.username} joined`,
            description: `Users currently in server: ${member.guild.memberCount}`,
            color: 3066993,
            timestamp: new Date(),
            footer: {
                iconURL: member.guild.iconURL() ?? undefined,
                text: "Corsace Logger",
            },
            thumbnail: {
                url: memberUser.avatarURL() ?? undefined,
            },
            fields: [
                {
                    name: "Registered?",
                    value: user ? `${memberUser.username} is registered` : `${memberUser.username} isn't registered`,
                },
            ],
        } as EmbedData);

        const channel = (await discordClient.channels.fetch(config.discord.logChannel))!;
        (channel as TextChannel).send({
            embeds: [embed],
        });
    }
}