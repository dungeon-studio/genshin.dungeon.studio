resource "aws_security_group_rule" "canary" {
  type              = "ingress"
  description       = "canary"
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = "sg-canary"
}
