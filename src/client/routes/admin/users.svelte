<script lang="ts">
	export let users: User[];
</script>

<h1>Users</h1>
<table>
	<thead>
		<tr>
			<th scope="col">Github ID</th>
			<th scope="col">ID</th>
			<th scope="col">Installation ID</th>
			<th scope="col">Name</th>
			<th scope="col">Token</th>
		</tr>
	</thead>
	<tbody>
		{#each users as user}
			<tr>
				<td>{user.id}</td>
				<td>{user.github_id}</td>
				<td>{user.installation_id}</td>
				<td>{user.name}</td>
				<td>{user.token}</td>
			</tr>
		{/each}
	</tbody>
</table>
