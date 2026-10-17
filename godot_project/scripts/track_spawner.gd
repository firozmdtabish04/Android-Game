extends Node3D

## MITTI RUN - Infinite Track Spawner
## Dynamically instantiates and recycles road chunks ahead of the runner.

@export var track_chunk_scene: PackedScene
@export var railway_crossing_scene: PackedScene
@export var obstacle_scenes: Array[PackedScene] = []
@export var coin_scene: PackedScene
@export var powerup_scenes: Array[PackedScene] = []

@export var player_node: Node3D
@export var initial_chunks: int = 8
@export var chunk_length: float = 30.0

var active_chunks: Array[Node3D] = []
var next_spawn_z: float = 0.0
var chunks_spawned_count: int = 0

func _ready() -> void:
	if not player_node:
		player_node = get_tree().get_first_node_in_group("player")
		
	# Spawn initial runway
	for i in range(initial_chunks):
		_spawn_next_chunk(i < 2) # First two chunks have no obstacles

func _process(_delta: float) -> void:
	if not player_node:
		return
		
	var player_z = player_node.position.z
	
	# If player has advanced past the oldest chunk, recycle it
	if active_chunks.size() > 0:
		var oldest_chunk = active_chunks[0]
		if oldest_chunk.position.z - chunk_length > player_z:
			active_chunks.remove_at(0)
			oldest_chunk.queue_free()
			_spawn_next_chunk(false)

func _spawn_next_chunk(is_safe_chunk: bool) -> void:
	chunks_spawned_count += 1
	var is_railway = (chunks_spawned_count % 6 == 0)
	
	var scene_to_spawn = track_chunk_scene
	if is_railway and railway_crossing_scene:
		scene_to_spawn = railway_crossing_scene
		
	if not scene_to_spawn:
		return
		
	var chunk = scene_to_spawn.instantiate()
	chunk.position = Vector3(0, 0, next_spawn_z)
	add_child(chunk)
	active_chunks.append(chunk)
	
	next_spawn_z -= chunk_length
	
	# Setup obstacles and coins
	var powerup_dict: Dictionary = {}
	if powerup_scenes.size() >= 3:
		powerup_dict = {
			"magnet": powerup_scenes[0],
			"shield": powerup_scenes[1],
			"boost": powerup_scenes[2]
		}
		
	if not is_safe_chunk and chunk.has_method("setup"):
		chunk.setup(obstacle_scenes, coin_scene, powerup_dict, is_railway)
