# Generated by Django 5.1.6 on 2025-02-20 20:26

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('articles', '0002_article_cognitive_bias_article_perspective_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='article',
            name='summary',
        ),
        migrations.RemoveField(
            model_name='article',
            name='word_count',
        ),
    ]
