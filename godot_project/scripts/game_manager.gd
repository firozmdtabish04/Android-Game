extends Node

## MITTI RUN - Game Manager AutoLoad
## Manages game lifecycle, score, distance, coins, power-ups, and persistence.

signal score_updated(new_score: int)
signal distance_updated(new_distance: float)
signal coins_updated(run_coins: int, total_coins: int)
signal powerup_started(powerup_type: String, duration: float)
signal powerup_ended(powerup_type: String)
signal game_state_changed(new_state: int)
signal player_crashed()

enum GameState {
	MENU,
	PLAYING,
	PAUSED,
	GAME_OVER
}

var current_state: GameState = GameState.MENU

# In-run stats
var current_score: int = 0
var current_distance: float = 0.0
var run_coins: int = 0
var current_speed: float = 14.0
const BASE_SPEED: float = 14.0
const MAX_SPEED: float = 28.0
const SPEED_INCREMENT: float = 0.003

# Powerup active durations & Periodic Speed
var magnet_timer: float = 0.0
var shield_active: bool = false
var boost_timer: float = 0.0
var last_milestone_level: int = 0
var milestone_surge_timer: float = 0.0
var run_time: float = 0.0
var speed_tier: int = 1
var last_speed_tier: int = 1
var current_level: int = 1
var max_level_reached: int = 1
var level_start_distance: float = 0.0
var level_target_distance: float = 350.0

signal speed_tier_updated(tier: int, kmh: float)
signal level_completed(level: int, next_dest: String, reward: int)

# Persistent data
var save_data: Dictionary = {}

# Characters catalog
var CHARACTERS: Dictionary = {
	"tabish": {
		"name": "Tabish",
		"tagline": "The Village Sprinter",
		"cost": 0,
		"color": Color(0.9, 0.3, 0.1), # Terracotta / Saffron
		"dhoti_color": Color(0.95, 0.95, 0.9),
		"unlocked": true
	},
	"akhil": {
		"name": "Akhil",
		"tagline": "The Daring Auto Driver",
		"cost": 150,
		"color": Color(0.15, 0.65, 0.25), # Bihar Rickshaw Green
		"dhoti_color": Color(0.95, 0.8, 0.1),
		"unlocked": false
	},
	"firoz": {
		"name": "Firoz",
		"tagline": "The Fast Runner",
		"cost": 300,
		"color": Color(0.85, 0.15, 0.45), # Vibrant Desi Pink
		"dhoti_color": Color(0.2, 0.5, 0.8),
		"unlocked": false
	}
}

# Maps & Environments Catalog
var MAPS: Dictionary = {
	"village": {
		"name": "Bihar Village",
		"short_name": "GAON",
		"ground_color": Color(0.24, 0.4, 0.16),
		"road_color": Color(0.48, 0.36, 0.26)
	},
	"bazaar": {
		"name": "Haat Bazaar",
		"short_name": "BAZAAR",
		"ground_color": Color(0.3, 0.2, 0.18),
		"road_color": Color(0.24, 0.21, 0.2)
	},
	"railway": {
		"name": "Railway Junction",
		"short_name": "PATNA JN",
		"ground_color": Color(0.22, 0.28, 0.31),
		"road_color": Color(0.13, 0.13, 0.13)
	},
	"highway": {
		"name": "NH-31 Highway",
		"short_name": "HIGHWAY",
		"ground_color": Color(0.33, 0.42, 0.18),
		"road_color": Color(0.1, 0.14, 0.15)
	},
	"tour": {
		"name": "Grand Bihar Tour",
		"short_name": "TOUR",
		"ground_color": Color(0.24, 0.4, 0.16),
		"road_color": Color(0.48, 0.36, 0.26)
	}
}

var selected_map: String = "village"
var current_biome: String = "village"

const SaveManagerClass = preload("res://scripts/save_manager.gd")

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_load_persistent_data()

func _load_persistent_data() -> void:
	save_data = SaveManagerClass.load_save_data()
	for char_id in save_data.get("unlocked_characters", ["Tabish Firoz"]):
		if CHARACTERS.has(char_id):
			CHARACTERS[char_id]["unlocked"] = true
	
	AudioManager.set_sound(save_data.get("sound_enabled", true))
	AudioManager.set_music(save_data.get("music_enabled", true))

func _save_persistent_data() -> void:
	SaveManagerClass.save_data(save_data)

func _process(delta: float) -> void:
	if current_state == GameState.PLAYING:
		run_time += delta

		# Check Destination Travel Progression (Level completion after travel target)
		if current_distance >= level_target_distance:
			complete_level()

		var new_tier: int = int(run_time / 15.0) + 1
		if new_tier > speed_tier:
			speed_tier = new_tier
			var kmh: float = (current_speed + (speed_tier - 1) * 1.1) * 3.6
			speed_tier_updated.emit(speed_tier, kmh)
			SoundManager.play_sfx("powerup")

		# Check for 5,000 score milestones
		var current_milestone: int = int(current_score / 5000)
		if current_milestone > last_milestone_level:
			last_milestone_level = current_milestone
			milestone_surge_timer = 10.0 # 10s of 1.5x speed
			SoundManager.play_sfx("powerup")
			
		if milestone_surge_timer > 0.0:
			milestone_surge_timer = max(0.0, milestone_surge_timer - delta)
			
		var milestone_mult: float = 1.0
		if milestone_surge_timer > 0.0:
			milestone_mult = 1.5
		elif last_milestone_level > 0:
			milestone_mult = 1.25

		var boost_mult = 1.6 if boost_timer > 0.0 else 1.0
		var level_speed_bonus: float = float(current_level - 1) * 1.5
		var tier_bonus: float = float(speed_tier - 1) * 1.1
		var base_pace: float = min(BASE_SPEED + level_speed_bonus + tier_bonus + SPEED_INCREMENT * delta * 60.0, MAX_SPEED + float(current_level - 1) * 1.0)
		current_speed = base_pace

		var speed_mult = milestone_mult * boost_mult
		var eff_speed = current_speed * speed_mult
		
		# Distance and score
		current_distance += eff_speed * delta
		current_score = int(current_distance) + (run_coins * 10)
		
		distance_updated.emit(current_distance)
		score_updated.emit(current_score)
		
		# Manage power-up timers
		if magnet_timer > 0.0:
			magnet_timer -= delta
			if magnet_timer <= 0.0:
				powerup_ended.emit("magnet")
				
		if boost_timer > 0.0:
			boost_timer -= delta
			if boost_timer <= 0.0:
				powerup_ended.emit("boost")

func complete_level() -> void:
	current_level += 1
	if current_level > max_level_reached:
		max_level_reached = current_level
	level_start_distance = current_distance
	level_target_distance = current_distance + 400.0 + float(current_level) * 100.0
	var reward: int = 50 + (current_level - 1) * 25
	run_coins += reward
	level_completed.emit(current_level - 1, "NEXT STAGE", reward)
	SoundManager.play_sfx("powerup")

func start_game() -> void:
	current_score = 0
	current_distance = 0.0
	run_coins = 0
	current_speed = BASE_SPEED
	magnet_timer = 0.0
	shield_active = false
	boost_timer = 0.0
	last_milestone_level = 0
	milestone_surge_timer = 0.0
	run_time = 0.0
	speed_tier = 1
	last_speed_tier = 1
	current_level = 1
	level_start_distance = 0.0
	level_target_distance = 350.0
	
	current_state = GameState.PLAYING
	game_state_changed.emit(current_state)
	coins_updated.emit(run_coins, get_total_coins())

func pause_game() -> void:
	if current_state == GameState.PLAYING:
		current_state = GameState.PAUSED
		game_state_changed.emit(current_state)

func resume_game() -> void:
	if current_state == GameState.PAUSED:
		current_state = GameState.PLAYING
		game_state_changed.emit(current_state)

func trigger_game_over() -> void:
	if current_state == GameState.PLAYING:
		current_state = GameState.GAME_OVER
		AudioManager.play_crash()
		player_crashed.emit()
		
		# Update persistent stats
		var prev_high = save_data.get("high_score", 0)
		var is_new_high = current_score > prev_high
		if is_new_high:
			save_data["high_score"] = current_score
			
		save_data["total_coins"] = save_data.get("total_coins", 0) + run_coins
		save_data["runs_played"] = save_data.get("runs_played", 0) + 1
		_save_persistent_data()
		
		game_state_changed.emit(current_state)

func return_to_menu() -> void:
	current_state = GameState.MENU
	game_state_changed.emit(current_state)

func add_coin() -> void:
	run_coins += 1
	AudioManager.play_coin()
	coins_updated.emit(run_coins, get_total_coins() + run_coins)

func activate_magnet(duration: float = 10.0) -> void:
	magnet_timer = duration
	AudioManager.play_powerup()
	powerup_started.emit("magnet", duration)

func activate_shield() -> void:
	shield_active = true
	AudioManager.play_powerup()
	powerup_started.emit("shield", 999.0)

func activate_boost(duration: float = 6.0) -> void:
	boost_timer = duration
	AudioManager.play_powerup()
	powerup_started.emit("boost", duration)

func consume_shield() -> bool:
	if shield_active:
		shield_active = false
		AudioManager.play_crash()
		powerup_ended.emit("shield")
		return true
	return false

func is_boosted() -> bool:
	return boost_timer > 0.0

func is_magnet_active() -> bool:
	return magnet_timer > 0.0

func get_high_score() -> int:
	return save_data.get("high_score", 0)

func get_total_coins() -> int:
	return save_data.get("total_coins", 0)

func get_selected_character() -> String:
	return save_data.get("selected_character", "Tabish Firoz")

func select_character(char_id: String) -> bool:
	if CHARACTERS.has(char_id) and CHARACTERS[char_id]["unlocked"]:
		save_data["selected_character"] = char_id
		_save_persistent_data()
		return true
	return false

func unlock_character(char_id: String) -> bool:
	if not CHARACTERS.has(char_id):
		return false
	var cost = CHARACTERS[char_id]["cost"]
	var total = get_total_coins()
	if total >= cost and not CHARACTERS[char_id]["unlocked"]:
		save_data["total_coins"] = total - cost
		var unlocked_list: Array = save_data.get("unlocked_characters", ["Tabish Firoz"])
		if not unlocked_list.has(char_id):
			unlocked_list.append(char_id)
		save_data["unlocked_characters"] = unlocked_list
		CHARACTERS[char_id]["unlocked"] = true
		save_data["selected_character"] = char_id
		_save_persistent_data()
		coins_updated.emit(run_coins, get_total_coins())
		return true
	return false
