extends Node3D

## MITTI RUN - Track Chunk
## Represents a modular segment of the rustic Bihar village road.

const CHUNK_LENGTH: float = 30.0
const LANES: Array[float] = [-2.5, 0.0, 2.5]

@export var is_railway_crossing: bool = false
@export var obstacle_container: Node3D
@export var coin_container: Node3D

var obstacle_scenes: Array[PackedScene] = []
var coin_scene: PackedScene
var powerup_scenes: Dictionary = {}

func setup(p_obstacle_scenes: Array[PackedScene], p_coin_scene: PackedScene, p_powerups: Dictionary, is_railway: bool = false) -> void:
	obstacle_scenes = p_obstacle_scenes
	coin_scene = p_coin_scene
	powerup_scenes = p_powerups
	is_railway_crossing = is_railway
	
	_spawn_content()

func _spawn_content() -> void:
	if not obstacle_container or not coin_container:
		return
		
	# Select which lanes get obstacles (ensure at least one lane is ALWAYS open)
	var available_lanes = [0, 1, 2]
	available_lanes.shuffle()
	
	# Determine number of obstacles on this chunk (1 or 2)
	var num_obstacles = 1 if randf() < 0.65 else 2
	var obstacle_lanes = available_lanes.slice(0, num_obstacles)
	var free_lane = available_lanes[available_lanes.size() - 1]
	
	for lane_idx in obstacle_lanes:
		var lane_x = LANES[lane_idx]
		var spawn_z = randf_range(-CHUNK_LENGTH * 0.4, CHUNK_LENGTH * 0.4)
		
		if obstacle_scenes.size() > 0:
			var obs_prefab = obstacle_scenes.pick_random()
			var obs_instance = obs_prefab.instantiate()
			obs_instance.position = Vector3(lane_x, 0.0, spawn_z)
			obstacle_container.add_child(obs_instance)
			
	# Spawn coin trails in the free lane or across the road
	if coin_scene and randf() < 0.8:
		var coin_lane_x = LANES[free_lane]
		var start_z = -10.0
		var num_coins = randi_range(3, 6)
		for i in range(num_coins):
			var coin = coin_scene.instantiate()
			coin.position = Vector3(coin_lane_x, 0.7, start_z + (i * 2.2))
			coin_container.add_child(coin)
			
	# Chance to spawn a power-up in free lane
	if powerup_scenes.size() > 0 and randf() < 0.18:
		var p_keys = powerup_scenes.keys()
		var p_key = p_keys.pick_random()
		var p_scene = powerup_scenes[p_key]
		var p_inst = p_scene.instantiate()
		p_inst.position = Vector3(LANES[free_lane], 0.8, randf_range(-5.0, 5.0))
		add_child(p_inst)
