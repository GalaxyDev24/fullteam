SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

DROP TABLE `games`;
DROP TABLE `custom_game_venues`;
DROP TABLE `game_venues`;
DROP TABLE `surface_types`;
DROP TABLE `game_info`;
DROP TABLE `game_positions`;
DROP TABLE `game_players`;
DROP TABLE `game_invites`;
DROP TABLE `game_applications`;
DROP TABLE `conversations`;
DROP TABLE `conversations_users`;
DROP TABLE `conversation_owners`;
DROP TABLE `messages`;
DROP TABLE `message_body_chat`;
DROP TABLE `message_body_player`;
DROP TABLE `user_message_seen`;
DROP TABLE `reg_info`;
DROP TABLE `user`;
DROP TABLE `notification_tokens`;
DROP TABLE `notifications`;
DROP TABLE `user_feedback`;
DROP TABLE `user_location`;
DROP TABLE `user_settings`;
DROP TABLE `facebook_ids`;
DROP TABLE `login_tokens`;
DROP TABLE `venues`;
DROP TABLE `teams`;
DROP TABLE `team_players`;
DROP TABLE `team_invites`;
DROP TABLE `team_conversations`;
DROP TABLE `one_time_id`;

CREATE TABLE IF NOT EXISTS `games` (
  `id` bigint(20) NOT NULL,
  `owner_id` bigint(20) NOT NULL,
	`is_custom_venue` tinyint(1) NOT NULL,
  `venue` integer NOT NULL,
  `transport` tinyint(1) NOT NULL,
  `public` tinyint(1) DEFAULT 1,
	`application_type` integer NOT NULL,
  `game_time` bigint unsigned NOT NULL,
	`time_created` bigint unsigned NOT NULL,
	`max_players` integer DEFAULT -1,
	`players_joined` integer DEFAULT 0,
  `meeting_place` varchar(512) NOT NULL,
  `description` TEXT NOT NULL,
	`lat` double NOT NULL,
	`lon` double NOT NULL
	`surface_type` int DEFAULT -1,
	`average_ability` double DEFAULT -1,
	`average_age` int DEFAULT -1,
	`cost` decimal(18,2) DEFAULT 0,
	`shin_pads` tinyint(1) DEFAULT 0
) ENGINE=MyISAM AUTO_INCREMENT=38 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE IF NOT EXISTS `surface_types` (
	`id` int NOT NULL,
	`name` char(30) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Table to list the players joined to a TURN_UP_AND_PLAY type game.
CREATE TABLE IF NOT EXISTS `game_players` (
	`game_id` bigint(20) NOT NULL,
	`user_id` bigint(20) NOT NULL
) ENGINE=MyISAM AUTO_INCREMENT=38 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE IF NOT EXISTS `game_applications` (
	`id` bigint(20) NOT NULL,
	`game_id` bigint(20) NOT NULL,
	`user_id` bigint(20) NOT NULL,
	`time` bigint(20) unsigned NOT NULL
) ENGINE=MyISAM AUTO_INCREMENT=38 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE IF NOT EXISTS `game_invites` (
  `game_id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `time` bigint unsigned NOT NULL
) ENGINE=MyISAM AUTO_INCREMENT=64 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE IF NOT EXISTS `conversations` (
	`id` bigint(20) NOT NULL,
	`last_message` bigint(20) DEFAULT NULL,
	`direct` tinyint(1) DEFAULT 0
) ENGINE=MyISAM AUTO_INCREMENT=64 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE IF NOT EXISTS `conversations_users` (
	`convo_id` bigint(20) NOT NULL,
	`user_id` bigint(20) NOT NULL
) ENGINE=MyISAM AUTO_INCREMENT=64 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE IF NOT EXISTS `conversation_owners` (
	`convo_id` bigint(20) NOT NULL,
	`user_id` bigint(20) NOT NULL
) ENGINE=MyISAM AUTO_INCREMENT=64 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE IF NOT EXISTS `messages` (
	`id` bigint(20) NOT NULL,
	`convo_id` bigint(20) NOT NULL,
	`time` bigint unsigned NOT NULL,
	`type` int DEFAULT 0
) ENGINE=MyISAM AUTO_INCREMENT=64 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- MESSAGE_BODY_CHAT = 0
-- MESSAGE_BODY_PLAYER = 1

CREATE TABLE IF NOT EXISTS `message_body_chat` (
	`message_id` bigint(20) NOT NULL,
	`author_id` bigint(20) NOT NULL,
	`message` VARCHAR(1024) NOT NULL
) ENGINE=MyISAM AUTO_INCREMENT=64 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE IF NOT EXISTS `message_body_player` (
	`message_id` bigint(20) NOT NULL,
	`user_id` bigint(20) NOT NULL,
	`joined` tinyint NOT NULL -- 1 if true, 0 if false
) ENGINE=MyISAM AUTO_INCREMENT=64 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_message_seen` (
	`convo_id` bigint(20) NOT NULL,
	`user_id` bigint(20) NOT NULL,
	`message_id` bigint(20)
) ENGINE=MyISAM AUTO_INCREMENT=64 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE IF NOT EXISTS `reg_info` (
  `user_id` bigint(20) NOT NULL,
  `name` varchar(100) COLLATE utf8_unicode_ci DEFAULT "Unspecified",
  `last_name` varchar(100) COLLATE utf8_unicode_ci DEFAULT "Unspecified",
  `picture` varchar(256) COLLATE utf8_unicode_ci NOT NULL,
  `cover_picture` varchar(256) COLLATE utf8_unicode_ci DEFAULT "",
  `birthday` varchar(30) COLLATE utf8_unicode_ci DEFAULT "Unspecified"
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE IF NOT EXISTS `user` (
  `id` bigint(30) NOT NULL,
  `email` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `pass` varchar(105),
	`position` integer NOT NULL,
  `last_active` BIGINT UNSIGNED, 
  `online` tinyint(1)
) ENGINE=MyISAM AUTO_INCREMENT=83 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE IF NOT EXISTS `facebook_ids` (
  `user_id` bigint(30) NOT NULL,
  `facebook_id` bigint(30) NOT NULL,
  UNIQUE (`user_id`, `facebook_id`)
)ENGINE=MyISAM AUTO_INCREMENT=83 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE IF NOT EXISTS `login_tokens` (
	`user_id` bigint(30) NOT NULL,
    `login_token` varchar(60) NOT NULL
)ENGINE=MyISAM AUTO_INCREMENT=83 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE IF NOT EXISTS `notifications` (
	`id` bigint(30) NOT NULL,
	`user_id` bigint(30) NOT NULL,
	`type` int NOT NULL,
	`time` bigint unsigned NOT NULL,
	`seen` tinyint(1) DEFAULT 0,
	`data` text NOT NULL,
	-- Optional, for easy searching of chat notifs
	`convo_id` bigint(30) DEFAULT -1 
) ENGINE=MyISAM AUTO_INCREMENT=83 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE IF NOT EXISTS `notification_tokens` (
	`id` bigint(30) NOT NULL,
	`user_id` bigint(30) NOT NULL,
	`type` VARCHAR(8) COLLATE utf8_unicode_ci NOT NULL,
	`token` VARCHAR(300) COLLATE utf8_unicode_ci NOT NULL
) ENGINE=MyISAM AUTO_INCREMENT=83 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_feedback` (
  `id` bigint(20) NOT NULL,
  `profile_user_id` bigint(20) NOT NULL,
  `from_user_id` bigint(20) NOT NULL,
  `passing` float NOT NULL,
  `shooting` float NOT NULL,
  `fitness` float NOT NULL,
  `reliability` float NOT NULL,
  `average` float NOT NULL,
  `feedback` varchar(250) COLLATE utf8_unicode_ci NOT NULL,
  `time_sent` BIGINT UNSIGNED NOT NULL
) ENGINE=MyISAM AUTO_INCREMENT=70 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_location` (
  `user_id` bigint(20) NOT NULL,
  `lat` double NOT NULL,
  `lon` double NOT NULL,
  `locality` varchar(60) COLLATE utf8_unicode_ci DEFAULT "Not Given",
  `country` varchar(30) COLLATE utf8_unicode_ci DEFAULT "Not Given"
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_settings` (
  `user_id` bigint(20) NOT NULL,
  `comments` tinyint(1) NOT NULL,
  `notifications` tinyint(1) NOT NULL,
  `searchable` tinyint(1) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE IF NOT EXISTS `teams` (
	`id` bigint(20) NOT NULL,
	`owner_id` bigint(20) NOT NULL,
	`name` VARCHAR(64) NOT NULL,
	`lat` double DEFAULT -1,
	`lon` double DEFAULT -1
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE IF NOT EXISTS `team_players` (
	`team_id` bigint(20) NOT NULL,
	`user_id` bigint(20) NOT NULL,
	`position` integer DEFAULT -1,
	`team_type` integer NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE IF NOT EXISTS `team_invites` (
	`team_id` bigint(20) NOT NULL,
	`user_id` bigint(20) NOT NULL,
	`team_type` integer NOT NULL,
	`position` integer DEFAULT -1
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE IF NOT EXISTS `team_conversations` (
	`team_id` bigint(20) NOT NULL,
	`conversation_id` bigint(20) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE IF NOT EXISTS `one_time_id` (
	`id` char(60) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

ALTER TABLE `games`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `game_info`
	ADD PRIMARY KEY (`game_id`);

ALTER TABLE `surface_types`
	ADD PRIMARY KEY (`id`);

ALTER TABLE `game_positions`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `game_invites`
  ADD PRIMARY KEY (`game_id`, `user_id`);

ALTER TABLE `game_applications`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `conversations`
  ADD PRIMARY KEY (`id`), ADD UNIQUE (`id`);

ALTER TABLE `conversation_owners`
  ADD PRIMARY KEY (`user_id`, `convo_id`);

ALTER TABLE `conversations_users`
  ADD PRIMARY KEY (`user_id`, `convo_id`);

ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`, `convo_id`), ADD UNIQUE (`id`, `convo_id`);

ALTER TABLE `message_body_chat`
  ADD PRIMARY KEY (`message_id`), ADD UNIQUE (`message_id`);

ALTER TABLE `message_body_player`
  ADD PRIMARY KEY (`message_id`), ADD UNIQUE (`message_id`);

ALTER TABLE `user_message_seen`
	ADD PRIMARY KEY (`user_id`, `convo_id`);

ALTER TABLE `my_team`
  ADD PRIMARY KEY (`id`), ADD UNIQUE (`id`);

ALTER TABLE `reg_info` 
  ADD UNIQUE (`user_id`);

ALTER TABLE `user`
  ADD PRIMARY KEY (`id`), ADD UNIQUE (`id`), ADD UNIQUE (`email`);

ALTER TABLE `notification_tokens`
  ADD PRIMARY KEY (`id`), ADD UNIQUE (`id`);

ALTER TABLE `user_feedback`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `user_location`
  ADD UNIQUE (`user_id`);

ALTER TABLE `user_settings`
  ADD UNIQUE (`user_id`);

ALTER TABLE `venues`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `teams`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `team_players`
  ADD PRIMARY KEY (`team_id`, `user_id`, `team_type`);

ALTER TABLE `team_invites`
  ADD PRIMARY KEY (`team_id`, `user_id`, `team_type`);

ALTER TABLE `team_conversations`
  ADD PRIMARY KEY (`team_id`, `conversation_id`);


ALTER TABLE `notifications`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=0;
ALTER TABLE `games`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=0;
ALTER TABLE `game_positions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=0;
ALTER TABLE `game_applications`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=0;
ALTER TABLE `conversations`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=0;
ALTER TABLE `messages`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=0;
ALTER TABLE `my_team`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=0;
ALTER TABLE `user`
  MODIFY `id` bigint(30) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=0;
ALTER TABLE `notification_tokens`
  MODIFY `id` bigint(30) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=0;
ALTER TABLE `user_feedback`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=0;
ALTER TABLE `teams`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=0;

INSERT INTO `venues` (id, name, lat, lon) VALUES(0, "venue0", 0, 0);
INSERT INTO `venues` (id, name, lat, lon) VALUES(1, "venue1", 20, 0);
INSERT INTO `venues` (id, name, lat, lon) VALUES(2, "venue2", 20, 20);
INSERT INTO `venues` (id, name, lat, lon) VALUES(3, "venue3", 0, 20);

INSERT INTO `surface_types` (id, name) VALUES(0, "GRASS");
INSERT INTO `surface_types` (id, name) VALUES(1, "3G");
INSERT INTO `surface_types` (id, name) VALUES(2, "ASTROTURF");
INSERT INTO `surface_types` (id, name) VALUES(3, "INDOOR");


