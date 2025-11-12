-- MafClub.biz Full Database Dump
-- Exported from Cloudflare D1
-- Date: 2025-11-12

BEGIN TRANSACTION;

-- MafClub.biz Database Schema

-- Players table
CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Game sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    total_games INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    game_number INTEGER NOT NULL,
    winner TEXT NOT NULL,
    is_clean_win INTEGER DEFAULT 0,
    is_dry_win INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES game_sessions(id)
);

-- Game results table
CREATE TABLE IF NOT EXISTS game_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    death_time TEXT,
    is_alive INTEGER DEFAULT 0,
    points INTEGER NOT NULL,
    black_checks INTEGER DEFAULT 0,
    red_checks INTEGER DEFAULT 0,
    achievements TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (player_id) REFERENCES players(id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_games_session ON games(session_id);
CREATE INDEX IF NOT EXISTS idx_games_number ON games(game_number);
CREATE INDEX IF NOT EXISTS idx_game_results_game ON game_results(game_id);
CREATE INDEX IF NOT EXISTS idx_game_results_player ON game_results(player_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_date ON game_sessions(date);

-- Data import

-- Players data
INSERT INTO players (id, name, created_at) VALUES (1, 'Ирина П.','2025-11-12 10:35:01');
INSERT INTO players (id, name, created_at) VALUES (2, 'Murka','2025-11-12 10:35:02');
INSERT INTO players (id, name, created_at) VALUES (3, 'Наталья К.','2025-11-12 10:35:02');
INSERT INTO players (id, name, created_at) VALUES (4, 'Александр Ю.','2025-11-12 10:35:02');
INSERT INTO players (id, name, created_at) VALUES (5, 'Jordan','2025-11-12 10:35:02');
INSERT INTO players (id, name, created_at) VALUES (6, 'Александр Б.','2025-11-12 10:35:03');
INSERT INTO players (id, name, created_at) VALUES (7, 'Core','2025-11-12 10:35:03');
INSERT INTO players (id, name, created_at) VALUES (8, 'Timtim','2025-11-12 10:35:03');
INSERT INTO players (id, name, created_at) VALUES (9, 'Tukin','2025-11-12 10:35:03');
INSERT INTO players (id, name, created_at) VALUES (10, 'Сергей К.','2025-11-12 10:35:04');
INSERT INTO players (id, name, created_at) VALUES (11, 'Network','2025-11-12 10:50:07');
INSERT INTO players (id, name, created_at) VALUES (12, 'Рита','2025-11-12 10:50:08');
INSERT INTO players (id, name, created_at) VALUES (13, 'Интуиция','2025-11-12 10:52:37');
INSERT INTO players (id, name, created_at) VALUES (14, 'Владимир С.','2025-11-12 10:52:37');
INSERT INTO players (id, name, created_at) VALUES (15, 'NLP','2025-11-12 10:52:38');
INSERT INTO players (id, name, created_at) VALUES (16, 'Руслан','2025-11-12 10:52:38');
INSERT INTO players (id, name, created_at) VALUES (17, 'Гуломджон','2025-11-12 12:13:15');
INSERT INTO players (id, name, created_at) VALUES (18, 'Grow','2025-11-12 12:13:16');
INSERT INTO players (id, name, created_at) VALUES (19, 'Надежда','2025-11-12 12:13:16');
INSERT INTO players (id, name, created_at) VALUES (20, 'Ольга В.','2025-11-12 12:13:16');
INSERT INTO players (id, name, created_at) VALUES (21, 'Мэйбл','2025-11-12 12:13:17');
INSERT INTO players (id, name, created_at) VALUES (22, 'Мария','2025-11-12 12:13:17');
INSERT INTO players (id, name, created_at) VALUES (23, 'Алексей К.','2025-11-12 12:17:33');
INSERT INTO players (id, name, created_at) VALUES (24, 'Диля','2025-11-12 12:20:49');
INSERT INTO players (id, name, created_at) VALUES (25, 'Hevens','2025-11-12 12:20:49');

-- Game sessions data
INSERT INTO game_sessions (id, date, total_games) VALUES (1, '2025-11-02', 1);
INSERT INTO game_sessions (id, date, total_games) VALUES (2, '2025-11-02', 1);
INSERT INTO game_sessions (id, date, total_games) VALUES (3, '2025-11-02', 1);
INSERT INTO game_sessions (id, date, total_games) VALUES (4, '2025-11-02', 1);
INSERT INTO game_sessions (id, date, total_games) VALUES (5, '2025-10-18', 1);
INSERT INTO game_sessions (id, date, total_games) VALUES (6, '2025-10-18', 1);
INSERT INTO game_sessions (id, date, total_games) VALUES (7, '2025-10-18', 1);
INSERT INTO game_sessions (id, date, total_games) VALUES (8, '2025-10-18', 1);
INSERT INTO game_sessions (id, date, total_games) VALUES (9, '2025-10-18', 1);

-- Games data
INSERT INTO games (id, session_id, game_number, winner, is_clean_win, is_dry_win) VALUES (1, 1, 5, 'Мафия', 0, 0);
INSERT INTO games (id, session_id, game_number, winner, is_clean_win, is_dry_win) VALUES (2, 2, 6, 'Мафия', 0, 1);
INSERT INTO games (id, session_id, game_number, winner, is_clean_win, is_dry_win) VALUES (3, 3, 7, 'Мафия', 0, 0);
INSERT INTO games (id, session_id, game_number, winner, is_clean_win, is_dry_win) VALUES (4, 4, 8, 'Мирные', 1, 0);
INSERT INTO games (id, session_id, game_number, winner, is_clean_win, is_dry_win) VALUES (5, 5, 1, 'Мирные', 0, 0);
INSERT INTO games (id, session_id, game_number, winner, is_clean_win, is_dry_win) VALUES (6, 6, 2, 'Мафия', 0, 0);
INSERT INTO games (id, session_id, game_number, winner, is_clean_win, is_dry_win) VALUES (7, 7, 3, 'Мафия', 0, 1);
INSERT INTO games (id, session_id, game_number, winner, is_clean_win, is_dry_win) VALUES (9, 9, 4, 'Мирные', 0, 0);

-- Game results data
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (1, 1, 1, 'Мирный', '0', 1, 0, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (2, 1, 2, 'Мирный', '1N', 0, 0, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (3, 1, 3, 'Мафия', '0', 1, 5, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (4, 1, 4, 'Дон', '3D', 0, 8, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (5, 1, 5, 'Мирный', '2D', 0, 0, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (6, 1, 6, 'Мафия', '0', 1, 5, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (7, 1, 7, 'Шериф', '2N', 0, -3, 0, 1, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (8, 1, 8, 'Мирный', '4D', 0, 0, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (9, 1, 9, 'Мирный', '0', 1, 0, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (10, 1, 10, 'Мирный', '3N', 0, 0, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (11, 2, 11, 'Шериф', '1N', 0, -3, 0, 1, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (12, 2, 4, 'Мирный', '2D', 0, 0, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (13, 2, 5, 'Дон', '0', 1, 10, 0, 0, '["Не покидал стола","Победа в сухую"]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (14, 2, 6, 'Мафия', '0', 1, 6, 0, 0, '["Победа в сухую"]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (15, 2, 8, 'Мирный', '2N', 0, 0, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (16, 2, 2, 'Мирный', '0', 1, 0, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (17, 2, 9, 'Мирный', '0', 1, 0, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (18, 2, 10, 'Мирный', '0', 1, 0, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (19, 2, 12, 'Мирный', '3D', 0, 0, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (20, 2, 1, 'Мафия', '0', 1, 6, 0, 0, '["Победа в сухую"]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (21, 3, 2, 'Мирный', '4D', 0, 0, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (22, 3, 13, 'Дон', '2D', 0, 8, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (23, 3, 6, 'Мирный', '2N', 0, 0, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (24, 3, 14, 'Мирный', '3N', 0, 0, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (25, 3, 3, 'Мирный', '0', 1, 0, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (26, 3, 7, 'Мафия', '0', 1, 5, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (27, 3, 12, 'Мирный', '0', 1, 0, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (28, 3, 15, 'Мирный', '3D', 0, 0, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (29, 3, 5, 'Шериф', '1N', 0, -3, 0, 1, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (30, 3, 16, 'Мафия', '0', 1, 5, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (31, 4, 16, 'Мирный', '1N', 0, 5, 0, 0, '["Чистая победа"]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (32, 4, 15, 'Шериф', '2N', 0, 8, 0, 2, '["Чистая победа"]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (33, 4, 9, 'Мафия', '4D', 0, 0, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (34, 4, 3, 'Дон', '2D', 0, -3, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (35, 4, 10, 'Мирный', '0', 1, 5, 0, 0, '["Чистая победа"]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (36, 4, 7, 'Мирный', '3N', 0, 5, 0, 0, '["Чистая победа"]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (37, 4, 12, 'Мирный', '0', 1, 5, 0, 0, '["Чистая победа"]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (38, 4, 5, 'Мирный', '0', 1, 5, 0, 0, '["Чистая победа"]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (39, 4, 4, 'Мафия', '3D', 0, 0, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (40, 4, 8, 'Мирный', '0', 1, 5, 0, 0, '["Чистая победа"]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (41, 5, 7, 'Дон', '3D', 0, -3, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (42, 5, 5, 'Мирный', '1N', 0, 6, 0, 0, '["Угадайка"]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (43, 5, 15, 'Мафия', '4D', 0, 3, 0, 0, '["Угадайка"]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (44, 5, 17, 'Мирный', '2D', 0, 4, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (45, 5, 18, 'Мафия', '5D', 0, 0, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (46, 5, 19, 'Мирный', '0', 1, 4, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (47, 5, 11, 'Мирный', '4N', 0, 4, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (48, 5, 20, 'Мирный', '0', 1, 4, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (49, 5, 21, 'Шериф', '0', 1, 9, 0, 3, '["Не покидал стола"]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (50, 5, 22, 'Мирный', '0', 1, 4, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (51, 6, 16, 'Мафия', '0', 1, 8, 0, 0, '["Угадайка"]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (52, 6, 18, 'Дон', '2D', 0, 8, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (53, 6, 7, 'Мирный', '4N', 0, 0, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (54, 6, 11, 'Шериф', '2N', 0, -3, 1, 1, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (55, 6, 22, 'Мирный', '3N', 0, 0, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (56, 6, 21, 'Мирный', '1N', 0, 0, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (57, 6, 19, 'Мирный', '0', 1, 0, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (58, 6, 20, 'Мафия', '3D', 0, 5, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (59, 6, 5, 'Мирный', '5D', 0, 0, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (60, 6, 23, 'Мирный', '4D', 0, 0, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (61, 7, 11, 'Дон', '0', 1, 10, 0, 0, '["Не покидал стола","Победа в сухую"]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (62, 7, 21, 'Мирный', '2D', 0, 0, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (63, 7, 18, 'Мирный', '2N', 0, 0, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (64, 7, 13, 'Мирный', '3D', 0, 0, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (65, 7, 7, 'Шериф', '0', 1, -3, 0, 2, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (66, 7, 20, 'Мирный', '1N', 0, 0, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (67, 7, 5, 'Мафия', '0', 1, 6, 0, 0, '["Победа в сухую"]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (68, 7, 15, 'Мирный', '0', 1, 0, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (69, 7, 17, 'Мирный', '0', 1, 0, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (70, 7, 16, 'Мафия', '0', 1, 6, 0, 0, '["Победа в сухую"]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (81, 9, 5, 'Дон', '2D', 0, -3, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (82, 9, 23, 'Мирный', '4D', 0, 4, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (83, 9, 20, 'Мирный', '1D', 0, 4, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (84, 9, 7, 'Мирный', '1N', 0, 4, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (85, 9, 15, 'Мафия', '5D', 0, 0, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (86, 9, 24, 'Шериф', '3N', 0, 7, 0, 1, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (87, 9, 13, 'Мирный', '4N', 0, 4, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (88, 9, 19, 'Мирный', '0', 1, 6, 0, 0, '["Угадайка"]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (89, 9, 18, 'Мафия', '3D', 0, 0, 0, 0, '[]');
INSERT INTO game_results (id, game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements) VALUES (90, 9, 25, 'Мирный', '0', 1, 6, 0, 0, '["Угадайка"]');

COMMIT;
