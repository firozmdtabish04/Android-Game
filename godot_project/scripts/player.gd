extends CharacterBody3D

## MITTI RUN - Player Controller
## 3-Lane runner with swiping, jumping, sliding, procedural desi character, and dust fx.

const LANE_WIDTH: float = 2.5
const LANE_POSITIONS: Array[float] = [-LANE_WIDTH, 0.0, LANE_WIDTH]

@export var current_lane: int = 1 # 0: Left, 1: Middle, 2: Right
@export var lane_change_speed: float = 16.0
@export var jump_velocity: float = 8.5
@export var gravity: float = 24.0
@export var slide_duration: float = 0.75

var is_jumping: bool = false
var is_sliding: bool = false
var slide_timer: float = 0.0
var vertical_velocity: float = 0.0

# Swipe gesture tracking
var touch_start_pos: Vector2 = Vector2.ZERO
var min_swipe_distance: float = 35.0

# Visual nodes
@onready var character_visual: Node3D = $Visual
@onready var collision_shape: CollisionShape3D = $CollisionShape3D
@onready var dust_particles: GPUParticles3D = $DustParticles
@onready var shield_bubble: MeshInstance3D = $ShieldBubble

# Animation variables
var run_bob_time: float = 0.0
var default_collider_height: float = 1.8
var default_collider_pos_y: float = 0.9

func _ready() -> void:
	GameManager.player_crashed.connect(_on_crashed)
	GameManager.powerup_started.connect(_on_powerup_started)
	GameManager.powerup_ended.connect(_on_powerup_ended)
	
	if shield_bubble:
		shield_bubble.visible = false
		
	_apply_character_skin()

func _apply_character_skin() -> void:
	var char_id = GameManager.get_selected_character()
	var char_info = GameManager.CHARACTERS.get(char_id, {})
	var kurta_color = char_info.get("color", Color(0.9, 0.3, 0.1))
	var dhoti_color = char_info.get("dhoti_color", Color(0.95, 0.95, 0.9))
	
	if has_node("Visual/Body"):
		var mat = StandardMaterial3D.new()
		mat.albedo_color = kurta_color
		$Visual/Body.material_override = mat
	if has_node("Visual/Legs"):
		var mat2 = StandardMaterial3D.new()
		mat2.albedo_color = dhoti_color
		$Visual/Legs.material_override = mat2

func _input(event: InputEvent) -> void:
	if GameManager.current_state != GameManager.GameState.PLAYING:
		return
		
	# Keyboard controls
	if event.is_action_pressed("ui_left") or (event is InputEventKey and event.keycode == KEY_A and event.pressed and not event.echo):
		change_lane(-1)
	elif event.is_action_pressed("ui_right") or (event is InputEventKey and event.keycode == KEY_D and event.pressed and not event.echo):
		change_lane(1)
	elif event.is_action_pressed("ui_up") or (event is InputEventKey and (event.keycode == KEY_W or event.keycode == KEY_SPACE) and event.pressed and not event.echo):
		jump()
	elif event.is_action_pressed("ui_down") or (event is InputEventKey and event.keycode == KEY_S and event.pressed and not event.echo):
		slide()
		
	# Touch & swipe controls for Android / Mobile
	if event is InputEventScreenTouch:
		if event.pressed:
			touch_start_pos = event.position
		else:
			_process_swipe(event.position - touch_start_pos)
	elif event is InputEventMouseButton:
		if event.pressed:
			touch_start_pos = event.position
		else:
			_process_swipe(event.position - touch_start_pos)

func _process_swipe(delta: Vector2) -> void:
	if delta.length() < min_swipe_distance:
		return
		
	if abs(delta.x) > abs(delta.y):
		# Horizontal swipe
		if delta.x > 0:
			change_lane(1)
		else:
			change_lane(-1)
	else:
		# Vertical swipe
		if delta.y < 0:
			jump()
		else:
			slide()

func change_lane(dir: int) -> void:
	var next_lane = clamp(current_lane + dir, 0, 2)
	if next_lane != current_lane:
		current_lane = next_lane
		AudioManager.play_click()

func jump() -> void:
	if is_on_floor() and not is_sliding:
		vertical_velocity = jump_velocity
		is_jumping = true
		AudioManager.play_jump()

func slide() -> void:
	if not is_sliding:
		is_sliding = true
		slide_timer = slide_duration
		# Fast-fall if sliding while in air
		if not is_on_floor():
			vertical_velocity = -jump_velocity * 1.5
		AudioManager.play_slide()
		
		# Lower collision shape during slide
		if collision_shape and collision_shape.shape is CapsuleShape3D:
			collision_shape.shape.height = 0.8
			collision_shape.position.y = 0.4

func _physics_process(delta: float) -> void:
	if GameManager.current_state != GameManager.GameState.PLAYING:
		return
		
	# Smooth lane transition
	var target_x = LANE_POSITIONS[current_lane]
	var current_x = position.x
	position.x = lerp(current_x, target_x, lane_change_speed * delta)
	
	# Apply forward movement
	var speed_mult = 1.6 if GameManager.is_boosted() else 1.0
	var forward_speed = GameManager.current_speed * speed_mult
	var forward_motion = -forward_speed * delta
	position.z += forward_motion
	
	# Gravity & Jump
	if not is_on_floor():
		vertical_velocity -= gravity * delta
	else:
		if not is_jumping:
			vertical_velocity = 0.0
			
	velocity.y = vertical_velocity
	velocity.x = 0.0
	velocity.z = 0.0
	move_and_slide()
	
	if is_on_floor() and is_jumping and vertical_velocity <= 0.0:
		is_jumping = false
		
	# Slide timer
	if is_sliding:
		slide_timer -= delta
		if slide_timer <= 0.0:
			_end_slide()
			
	# Update animations and visuals
	_animate_character(delta)
	
	# Magnetize nearby coins
	if GameManager.is_magnet_active():
		_attract_coins(delta)

func _end_slide() -> void:
	is_sliding = false
	if collision_shape and collision_shape.shape is CapsuleShape3D:
		collision_shape.shape.height = default_collider_height
		collision_shape.position.y = default_collider_pos_y

func _animate_character(delta: float) -> void:
	if not character_visual:
		return
		
	if is_sliding:
		character_visual.scale = Vector3(1.1, 0.45, 1.3)
		character_visual.position.y = 0.2
		character_visual.rotation_degrees.x = 25.0
	elif not is_on_floor():
		character_visual.scale = Vector3(1.0, 1.1, 0.9)
		character_visual.position.y = 0.0
		character_visual.rotation_degrees.x = -15.0
	else:
		# Running bob
		run_bob_time += delta * GameManager.current_speed * 1.5
		var bob_y = abs(sin(run_bob_time)) * 0.15
		var tilt_z = sin(run_bob_time * 0.5) * 5.0
		character_visual.scale = Vector3(1.0, 1.0, 1.0)
		character_visual.position.y = bob_y
		character_visual.rotation_degrees.z = tilt_z
		character_visual.rotation_degrees.x = 10.0 # Lean forward

func _attract_coins(delta: float) -> void:
	var coins = get_tree().get_nodes_in_group("coins")
	for coin in coins:
		if is_instance_valid(coin):
			var dist = position.distance_to(coin.global_position)
			if dist < 12.0:
				var pull_dir = (global_position + Vector3(0, 0.8, 0) - coin.global_position).normalized()
				coin.global_position += pull_dir * 18.0 * delta

func handle_obstacle_hit(obstacle_type: String) -> void:
	if GameManager.is_boosted():
		# Smash through obstacle when super boosted!
		AudioManager.play_crash()
		return
		
	if GameManager.consume_shield():
		# Shield absorbed impact
		_blink_invulnerability()
		return
		
	# Game over
	GameManager.trigger_game_over()

func _blink_invulnerability() -> void:
	if character_visual:
		var tween = create_tween()
		for i in range(4):
			tween.tween_property(character_visual, "visible", false, 0.08)
			tween.tween_property(character_visual, "visible", true, 0.08)

func _on_powerup_started(powerup_type: String, duration: float) -> void:
	if powerup_type == "shield" and shield_bubble:
		shield_bubble.visible = true

func _on_powerup_ended(powerup_type: String) -> void:
	if powerup_type == "shield" and shield_bubble:
		shield_bubble.visible = false

func _on_crashed() -> void:
	if character_visual:
		var tween = create_tween()
		tween.tween_property(character_visual, "rotation_degrees:x", -85.0, 0.25)
		tween.parallel().tween_property(character_visual, "position:y", 0.1, 0.25)
