extends Area3D

## MITTI RUN - Golden Rupee Coin

@export var rotation_speed: float = 3.5

func _ready() -> void:
	add_to_group("coins")
	body_entered.connect(_on_body_entered)

func _process(delta: float) -> void:
	rotate_y(rotation_speed * delta)

func _on_body_entered(body: Node3D) -> void:
	if body.has_method("handle_obstacle_hit"):
		GameManager.add_coin()
		
		# Quick collect pop animation
		var tween = create_tween()
		tween.tween_property(self, "scale", scale * 1.5, 0.08)
		tween.tween_property(self, "scale", Vector3.ZERO, 0.08)
		tween.tween_callback(queue_free)
