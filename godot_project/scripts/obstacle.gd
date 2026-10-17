extends Area3D

## MITTI RUN - Obstacle Base Script

@export_enum("tractor", "auto_rickshaw", "bicycle", "pothole", "barrier") var obstacle_type: String = "tractor"
@export var can_slide_under: bool = false
@export var can_jump_over: bool = false

func _ready() -> void:
	body_entered.connect(_on_body_entered)

func _on_body_entered(body: Node3D) -> void:
	if body.has_method("handle_obstacle_hit"):
		if can_slide_under and body.is_sliding:
			# Successfully ducked under!
			return
		if can_jump_over and body.is_jumping and body.position.y > 1.2:
			# Successfully cleared the jump!
			return
			
		body.handle_obstacle_hit(obstacle_type)
